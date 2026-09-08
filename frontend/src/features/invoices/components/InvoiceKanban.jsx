import React, { useMemo } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { FileText, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount || 0);
};

const COLUMNS = [
  { id: 'draft', title: 'Draft' },
  { id: 'sent', title: 'Sent' },
  { id: 'overdue', title: 'Overdue' },
  { id: 'paid', title: 'Paid' },
  { id: 'cancelled', title: 'Cancelled' },
];

function SortableInvoiceCard({ invoice }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: invoice.id, data: { type: "Invoice", invoice } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm cursor-grab active:cursor-grabbing mb-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
          <FileText className="w-4 h-4 mr-1.5" />
          {invoice.invoice_number || `INV-${invoice.id}`}
        </div>
        <span className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <MoreHorizontal className="w-4 h-4" />
        </span>
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
        {typeof invoice.client === 'object' ? invoice.client?.name : `Client #${invoice.client}`}
      </div>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d') : '-'}
        </div>
        <div className="text-sm font-bold text-gray-900 dark:text-white">
          {formatCurrency(invoice.total_amount)}
        </div>
      </div>
    </div>
  );
}

function InvoiceColumn({ column, invoices }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: { type: "Column", column },
  });

  const invoiceIds = useMemo(() => invoices.map((i) => i.id), [invoices]);

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-2xl w-80 min-w-[320px] flex-shrink-0 border border-gray-200 dark:border-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
          {column.title}
          <span className="ml-2 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs py-0.5 px-2 rounded-full">
            {invoices.length}
          </span>
        </h3>
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[150px]">
        <SortableContext items={invoiceIds} strategy={verticalListSortingStrategy}>
          {invoices.map((invoice) => (
            <SortableInvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function InvoiceKanban({ invoices, isLoading, onUpdateStatus }) {
  const [activeInvoice, setActiveInvoice] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading board...</div>;
  }

  const columnsWithInvoices = useMemo(() => {
    return COLUMNS.map(col => ({
      ...col,
      invoices: invoices.filter(inv => inv.status === col.id)
    }));
  }, [invoices]);

  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === "Invoice") {
      setActiveInvoice(active.data.current.invoice);
    }
  };

  const handleDragEnd = (event) => {
    setActiveInvoice(null);
    const { active, over } = event;
    if (!over) return;

    const invoiceId = active.id;
    const overId = over.id;

    // Moving over a column directly
    const isOverColumn = over.data.current?.type === "Column";
    if (isOverColumn) {
      if (activeInvoice.status !== overId) {
        onUpdateStatus(invoiceId, overId);
      }
      return;
    }

    // Moving over another invoice
    const overInvoice = over.data.current?.invoice;
    if (overInvoice && activeInvoice.status !== overInvoice.status) {
      onUpdateStatus(invoiceId, overInvoice.status);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 h-[calc(100vh-280px)]">
        {columnsWithInvoices.map((column) => (
          <InvoiceColumn key={column.id} column={column} invoices={column.invoices} />
        ))}
      </div>

      <DragOverlay>
        {activeInvoice ? (
          <div className="opacity-80 rotate-2 scale-105 shadow-xl">
             <SortableInvoiceCard invoice={activeInvoice} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
