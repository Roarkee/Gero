import React, { useState, useEffect } from "react";
import { useClients, useUpdateClient } from "../hooks/useClients";
import { ClientCard } from "../components/ClientCard";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PIPELINE_COLUMNS = [
  { id: "lead", title: "Lead" },
  { id: "inquiry", title: "Inquiry" },
  { id: "proposal_sent", title: "Proposal Sent" },
  { id: "negotiating", title: "Negotiating" },
  { id: "onboarding", title: "Onboarding" },
  { id: "active", title: "Active" },
  { id: "waiting_on_client", title: "Waiting" },
  { id: "revision", title: "Revision" },
  { id: "completed", title: "Completed" },
  { id: "paused", title: "Paused" },
  { id: "dormant", title: "Dormant" },
  { id: "churned", title: "Churned" },
];

function SortableClientCard({ client }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: client.id,
    data: { type: "Client", client },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 outline-none">
      <ClientCard client={client} />
    </div>
  );
}

function Column({ column, clients }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const columnBg = isOver ? "bg-primary-900/30 border-primary-500/50 shadow-neon" : "glass-card border-white/10";
  return (
    <div ref={setNodeRef} className={columnBg + " flex flex-col rounded-xl border w-72 shrink-0 transition-all duration-300"}>
      <div className="p-3 border-b border-white/10 flex justify-between items-center rounded-t-xl bg-white/5">
        <h3 className="font-heading font-semibold text-sm text-gray-200">{column.title}</h3>
        <span className="bg-primary-900/50 text-primary-300 text-xs py-0.5 px-2 rounded-full border border-primary-500/30 font-medium shadow-[0_0_10px_rgba(0,240,255,0.1)]">
          {clients.length}
        </span>
      </div>
      <div className="p-3 flex-1 overflow-y-auto min-h-[400px]">
        <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {clients.map((client) => (
            <SortableClientCard key={client.id} client={client} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function PipelineBoard() {
  const { data: serverClients, isLoading } = useClients();
  const updateClient = useUpdateClient();
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);

  useEffect(() => {
    if (serverClients) {
      setClients(serverClients);
    }
  }, [serverClients]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const client = clients.find((c) => c.id === active.id);
    setActiveClient(client);
  };

  const handleDragEnd = (event) => {
    setActiveClient(null);
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeClient = clients.find(c => c.id === activeId);
    if (!activeClient) return;

    // Is it dropped over a column or another card?
    const isOverColumn = PIPELINE_COLUMNS.some(col => col.id === overId);
    let newStatus = activeClient.status;

    if (isOverColumn) {
      newStatus = overId;
    } else {
      const overClient = clients.find(c => c.id === overId);
      if (overClient) {
        newStatus = overClient.status;
      }
    }

    if (activeClient.status !== newStatus) {
      // Optimistic update
      setClients(prev => prev.map(c => c.id === activeId ? { ...c, status: newStatus } : c));
      
      // Server update
      updateClient.mutate({ id: activeId, status: newStatus }, {
        onError: () => {
          // Rollback on error
          setClients(prev => prev.map(c => c.id === activeId ? { ...c, status: activeClient.status } : c));
        }
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gray-500">Loading pipeline...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-500 drop-shadow-[0_0_10px_rgba(0,240,255,0.3)]">Pipeline Board</h1>
        <p className="text-sm text-gray-400 mt-1">Drag and drop clients to update their status.</p>
      </div>

      {/* 160px = ClientsLayout nav bar (~57px) + PipelineBoard header (~96px) + breathing room */}
      <div
        className="custom-scrollbar"
        style={{
          height: "calc(100vh - 250px)",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="inline-flex flex-nowrap gap-4 items-start h-full pr-4 pb-4">
            {PIPELINE_COLUMNS.map((col) => (
              <Column
                key={col.id}
                column={col}
                clients={clients.filter((c) => c.status === col.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeClient ? (
              <div className="rotate-2 scale-105 opacity-90 cursor-grabbing shadow-2xl">
                <ClientCard client={activeClient} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
