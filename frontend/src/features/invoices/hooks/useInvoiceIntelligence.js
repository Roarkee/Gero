import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "../api/invoices.api";
import { useInvoices } from "./useInvoices";

// Frontend calculation helpers
const calculateRevenueIntelligence = (invoices) => {
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  const outstandingInvoices = invoices.filter(inv => ['sent', 'draft', 'overdue'].includes(inv.status));
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

  const totalRevenue = paidInvoices.reduce((acc, inv) => acc + parseFloat(inv.total_amount || 0), 0);
  const outstandingRevenue = outstandingInvoices.reduce((acc, inv) => acc + parseFloat(inv.total_amount || 0), 0);
  const overdueRevenue = overdueInvoices.reduce((acc, inv) => acc + parseFloat(inv.total_amount || 0), 0);

  const avgInvoiceSize = paidInvoices.length ? totalRevenue / paidInvoices.length : 0;

  // Monthly breakdown for trend chart
  const monthlyRevenue = {};
  paidInvoices.forEach(inv => {
    if (!inv.issue_date) return;
    const date = new Date(inv.issue_date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + parseFloat(inv.total_amount || 0);
  });

  const trendData = Object.keys(monthlyRevenue).sort().map(key => ({
    month: key,
    revenue: monthlyRevenue[key]
  }));

  return {
    totalRevenue,
    outstandingRevenue,
    overdueRevenue,
    avgInvoiceSize,
    paidCount: paidInvoices.length,
    sentCount: outstandingInvoices.length,
    trendData
  };
};

const calculateCollectionIntelligence = (invoices) => {
  const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.issue_date);
  
  let totalDaysToPay = 0;
  paidInvoices.forEach(inv => {
    // Proxy for payment date: if paid, calculate diff from issue date to current date or a stored paid_date if it exists
    const paidDate = inv.paid_at ? new Date(inv.paid_at) : new Date(inv.updated_at || inv.issue_date);
    const issueDate = new Date(inv.issue_date);
    const diffTime = Math.abs(paidDate - issueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    totalDaysToPay += diffDays;
  });

  const avgCollectionDays = paidInvoices.length ? Math.round(totalDaysToPay / paidInvoices.length) : 0;
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
  const totalCount = invoices.filter(inv => inv.status !== 'draft' && inv.status !== 'cancelled').length;
  const collectionRate = totalCount ? Math.round((paidInvoices.length / totalCount) * 100) : 100;
  
  let healthScore = 'Good';
  if (collectionRate < 70) healthScore = 'Critical';
  else if (collectionRate < 85 || avgCollectionDays > 30) healthScore = 'Needs Attention';
  else if (collectionRate > 95 && avgCollectionDays < 15) healthScore = 'Excellent';

  return {
    collectionRate,
    avgCollectionDays,
    healthScore,
    latePaymentTrends: overdueCount > 0 ? 'increasing' : 'stable'
  };
};

const calculateClientIntelligence = (invoices) => {
  const clientStats = {};

  invoices.forEach(inv => {
    // If inv.client is an object with id/name, use it. If it's an ID, we might just group by ID.
    // For this example, assuming backend provides at least client name or we just map by string.
    const clientId = typeof inv.client === 'object' ? inv.client?.id : inv.client;
    const clientName = typeof inv.client === 'object' ? inv.client?.name : `Client #${inv.client}`;
    
    if (!clientId) return;

    if (!clientStats[clientId]) {
      clientStats[clientId] = {
        id: clientId,
        name: clientName,
        totalInvoiced: 0,
        paidCount: 0,
        overdueCount: 0,
        totalCount: 0
      };
    }

    clientStats[clientId].totalInvoiced += parseFloat(inv.total_amount || 0);
    clientStats[clientId].totalCount += 1;
    if (inv.status === 'paid') clientStats[clientId].paidCount += 1;
    if (inv.status === 'overdue') clientStats[clientId].overdueCount += 1;
  });

  return Object.values(clientStats).map(client => {
    const overdueRatio = client.totalCount ? (client.overdueCount / client.totalCount) * 100 : 0;
    let riskLevel = 'Low';
    if (overdueRatio > 40) riskLevel = 'High';
    else if (overdueRatio > 15) riskLevel = 'Medium';

    return {
      ...client,
      overdueRatio: Math.round(overdueRatio),
      riskLevel
    };
  });
};

const calculateCashFlowIntelligence = (invoices) => {
  const unpaidInvoices = invoices.filter(inv => ['sent', 'overdue'].includes(inv.status));
  const buckets = {
    '0-30 days': 0,
    '31-60 days': 0,
    '61-90 days': 0,
    '90+ days': 0
  };

  const today = new Date();

  unpaidInvoices.forEach(inv => {
    if (!inv.due_date) return;
    const dueDate = new Date(inv.due_date);
    const diffTime = today - dueDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const amount = parseFloat(inv.total_amount || 0);

    if (diffDays <= 0) {
      // Upcoming
    } else if (diffDays <= 30) {
      buckets['0-30 days'] += amount;
    } else if (diffDays <= 60) {
      buckets['31-60 days'] += amount;
    } else if (diffDays <= 90) {
      buckets['61-90 days'] += amount;
    } else {
      buckets['90+ days'] += amount;
    }
  });

  return {
    buckets,
    upcomingInvoices: unpaidInvoices.filter(inv => inv.due_date && new Date(inv.due_date) >= today)
  };
};

export const useInvoiceIntelligence = () => {
  const { invoicesQuery } = useInvoices();
  const rawData = invoicesQuery.data;
  const invoices = rawData?.results || rawData || [];

  // Revenue Intelligence
  const revenueQuery = useQuery({
    queryKey: ["invoiceRevenueIntelligence"],
    queryFn: invoicesApi.getRevenueIntelligence,
    retry: false, // Don't retry if endpoint is missing
  });

  // Collection Intelligence
  const collectionQuery = useQuery({
    queryKey: ["invoiceCollectionIntelligence"],
    queryFn: invoicesApi.getCollectionIntelligence,
    retry: false,
  });

  // Client Intelligence
  const clientQuery = useQuery({
    queryKey: ["invoiceClientIntelligence"],
    queryFn: invoicesApi.getClientIntelligence,
    retry: false,
  });

  // Cash Flow Intelligence
  const cashFlowQuery = useQuery({
    queryKey: ["invoiceCashFlowIntelligence"],
    queryFn: invoicesApi.getCashFlowIntelligence,
    retry: false,
  });

  // Fallbacks
  const revenueData = revenueQuery.isError ? calculateRevenueIntelligence(invoices) : revenueQuery.data;
  const collectionData = collectionQuery.isError ? calculateCollectionIntelligence(invoices) : collectionQuery.data;
  const clientData = clientQuery.isError ? calculateClientIntelligence(invoices) : clientQuery.data;
  const cashFlowData = cashFlowQuery.isError ? calculateCashFlowIntelligence(invoices) : cashFlowQuery.data;

  // Concentration Risk calculation
  const totalRevenue = revenueData?.totalRevenue || 1;
  const clientsWithConcentration = (clientData || []).map(client => ({
    ...client,
    revenueShare: Math.round((client.totalInvoiced / totalRevenue) * 100)
  })).sort((a, b) => b.revenueShare - a.revenueShare);

  const topClient = clientsWithConcentration[0];
  const hasConcentrationRisk = topClient && topClient.revenueShare > 40;

  return {
    revenueData,
    collectionData,
    clientData: clientsWithConcentration,
    cashFlowData,
    hasConcentrationRisk,
    topClient,
    isLoading: invoicesQuery.isLoading,
  };
};
