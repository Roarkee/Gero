import { useQuery } from "@tanstack/react-query";
import { invoicesApi } from "../api/invoices.api";
import { useInvoices } from "./useInvoices";

// ─── Local fallback calculators ──────────────────────────────────────────────

const calculateRevenueIntelligence = (invoices) => {
  const paidInvoices = invoices.filter(inv => inv.status === 'paid');
  // Total pipeline includes draft, sent, overdue, and remaining partly_paid balances
  const pipelineInvoices = invoices.filter(inv => ['draft', 'sent', 'overdue', 'partly_paid'].includes(inv.status));
  // True outstanding receivables are issued and awaiting payment (sent, overdue, partly_paid - strictly excluding drafts)
  const outstandingInvoices = invoices.filter(inv => ['sent', 'overdue', 'partly_paid'].includes(inv.status));
  const draftInvoices = invoices.filter(inv => inv.status === 'draft');
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue');

  const totalRevenue = paidInvoices.reduce((acc, inv) => acc + parseFloat(inv.total_amount || 0), 0);
  const pipelineRevenue = pipelineInvoices.reduce((acc, inv) => acc + (parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0)), 0);
  const outstandingRevenue = outstandingInvoices.reduce((acc, inv) => acc + (parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0)), 0);
  const draftRevenue = draftInvoices.reduce((acc, inv) => acc + parseFloat(inv.total_amount || 0), 0);
  const overdueRevenue = overdueInvoices.reduce((acc, inv) => acc + (parseFloat(inv.total_amount || 0) - parseFloat(inv.amount_paid || 0)), 0);
  const avgInvoiceSize = paidInvoices.length ? totalRevenue / paidInvoices.length : 0;

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
    pipelineRevenue,
    outstandingRevenue,
    draftRevenue,
    overdueRevenue,
    avgInvoiceSize,
    paidCount: paidInvoices.length,
    pipelineCount: pipelineInvoices.length,
    sentCount: outstandingInvoices.length,
    draftCount: draftInvoices.length,
    overdueCount: overdueInvoices.length,
    trendData
  };
};

const calculateCollectionIntelligence = (invoices) => {
  const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.issue_date);
  let totalDaysToPay = 0;
  paidInvoices.forEach(inv => {
    const paidDate = inv.paid_date ? new Date(inv.paid_date) : new Date(inv.updated_at || inv.issue_date);
    const issueDate = new Date(inv.issue_date);
    totalDaysToPay += Math.ceil(Math.abs(paidDate - issueDate) / (1000 * 60 * 60 * 24));
  });
  const avgCollectionDays = paidInvoices.length ? Math.round(totalDaysToPay / paidInvoices.length) : 0;
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
  const totalCount = invoices.filter(inv => inv.status !== 'draft' && inv.status !== 'cancelled').length;
  const collectionRate = totalCount ? Math.round((paidInvoices.length / totalCount) * 100) : 100;
  let healthScore = 'Good';
  if (collectionRate < 70) healthScore = 'Critical';
  else if (collectionRate < 85 || avgCollectionDays > 30) healthScore = 'Needs Attention';
  else if (collectionRate > 95 && avgCollectionDays < 15) healthScore = 'Excellent';
  const needsAttentionInvoices = invoices.filter(inv => inv.status === 'overdue');
  return { collectionRate, avgCollectionDays, healthScore, latePaymentTrends: overdueCount > 0 ? 'increasing' : 'stable', needsAttentionInvoices };
};

const calculateClientIntelligence = (invoices) => {
  const clientStats = {};
  invoices.forEach(inv => {
    const clientId = typeof inv.client === 'object' ? inv.client?.id : inv.client;
    const clientName = typeof inv.client === 'object' ? inv.client?.name : `Client #${inv.client}`;
    if (!clientId) return;
    if (!clientStats[clientId]) {
      clientStats[clientId] = { id: clientId, name: clientName, totalInvoiced: 0, paidCount: 0, overdueCount: 0, totalCount: 0 };
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
    return { ...client, overdueRatio: Math.round(overdueRatio), riskLevel };
  });
};

const calculateCashFlowIntelligence = (invoices) => {
  const unpaidInvoices = invoices.filter(inv => ['sent', 'overdue'].includes(inv.status));
  const buckets = { '0-30 days': 0, '31-60 days': 0, '61-90 days': 0, '90+ days': 0 };
  const today = new Date();
  unpaidInvoices.forEach(inv => {
    if (!inv.due_date) return;
    const dueDate = new Date(inv.due_date);
    const diffDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    const amount = parseFloat(inv.total_amount || 0);
    if (diffDays <= 0) { /* upcoming */ }
    else if (diffDays <= 30) buckets['0-30 days'] += amount;
    else if (diffDays <= 60) buckets['31-60 days'] += amount;
    else if (diffDays <= 90) buckets['61-90 days'] += amount;
    else buckets['90+ days'] += amount;
  });
  return { buckets, upcomingInvoices: unpaidInvoices.filter(inv => inv.due_date && new Date(inv.due_date) >= today) };
};

// ─── Backend response normalizers ────────────────────────────────────────────

/**
 * Backend returns [{month, amount}, ...] from revenue/monthly/
 * plus [{client_id, client__name, total}, ...] from revenue/top-clients/
 * We need to combine them into the shape pages expect.
 */
const normalizeRevenue = (monthlyData, topClients, invoices) => {
  if (!monthlyData || !Array.isArray(monthlyData)) return calculateRevenueIntelligence(invoices);

  const trendData = monthlyData
    .filter(d => d.month)
    .map(d => ({ month: d.month ? d.month.slice(0, 7) : '', revenue: parseFloat(d.amount || 0) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const totalRevenue = trendData.reduce((acc, d) => acc + d.revenue, 0);

  // Supplement with local invoice data for pipeline/outstanding/overdue
  const local = calculateRevenueIntelligence(invoices);

  return {
    totalRevenue: totalRevenue || local.totalRevenue,
    pipelineRevenue: local.pipelineRevenue,
    outstandingRevenue: local.outstandingRevenue,
    draftRevenue: local.draftRevenue,
    overdueRevenue: local.overdueRevenue,
    avgInvoiceSize: local.avgInvoiceSize,
    paidCount: local.paidCount,
    pipelineCount: local.pipelineCount,
    sentCount: local.sentCount,
    draftCount: local.draftCount,
    overdueCount: local.overdueCount,
    trendData,
  };
};

/**
 * Backend returns {score, rating} from collection/performance/
 * and {collection_rate} from collection/rate/
 * Pages expect {collectionRate, avgCollectionDays, healthScore}
 */
const normalizeCollection = (performanceData, rateData, invoices) => {
  if (!performanceData) return calculateCollectionIntelligence(invoices);
  const local = calculateCollectionIntelligence(invoices);
  return {
    collectionRate: rateData?.collection_rate ?? local.collectionRate,
    avgCollectionDays: local.avgCollectionDays,
    healthScore: performanceData.rating ?? local.healthScore,
    score: performanceData.score,
    latePaymentTrends: local.latePaymentTrends,
    needsAttentionInvoices: local.needsAttentionInvoices,
  };
};

/**
 * Backend returns [{client, risk, score}] from clients/risk/
 * Pages expect [{id, name, totalInvoiced, paidCount, totalCount, overdueRatio, riskLevel}]
 * The backend risk report doesn't include financial totals, so we merge with local data.
 */
const normalizeClientData = (backendRiskData, invoices) => {
  const localData = calculateClientIntelligence(invoices);

  if (!backendRiskData || !Array.isArray(backendRiskData) || backendRiskData.length === 0) {
    return localData;
  }

  // Build a lookup of backend risk levels by client name
  const riskByName = {};
  backendRiskData.forEach(item => {
    if (item.client) riskByName[item.client] = item.risk;
  });

  // Overlay backend risk level on top of locally-calculated financial data
  return localData.map(client => ({
    ...client,
    riskLevel: riskByName[client.name] ?? client.riskLevel,
  }));
};

/**
 * Backend returns {outstanding_amount, overdue_amount} from cashflow/receivables/
 * Pages also need {buckets, upcomingInvoices} for the aging chart — those come from local calc.
 */
const normalizeCashFlow = (backendData, invoices) => {
  const local = calculateCashFlowIntelligence(invoices);
  if (!backendData) return local;
  return {
    ...local,
    outstandingAmount: backendData.outstanding_amount,
    overdueAmount: backendData.overdue_amount,
  };
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useInvoiceIntelligence = () => {
  const { invoicesQuery } = useInvoices();
  const rawData = invoicesQuery.data;
  const invoices = rawData?.results || rawData || [];

  // Revenue: monthly trend
  const revenueMonthlyQuery = useQuery({
    queryKey: ["invoiceRevenueMonthly"],
    queryFn: invoicesApi.getRevenueIntelligence,
    retry: false,
  });

  // Revenue: top clients (for concentration calc)
  const revenueTopClientsQuery = useQuery({
    queryKey: ["invoiceRevenueTopClients"],
    queryFn: invoicesApi.getRevenueTopClients,
    retry: false,
  });

  // Collection: performance score & rating
  const collectionPerfQuery = useQuery({
    queryKey: ["invoiceCollectionPerformance"],
    queryFn: invoicesApi.getCollectionIntelligence,
    retry: false,
  });

  // Collection: collection rate %
  const collectionRateQuery = useQuery({
    queryKey: ["invoiceCollectionRate"],
    queryFn: invoicesApi.getCollectionRate,
    retry: false,
  });

  // Client: risk report
  const clientRiskQuery = useQuery({
    queryKey: ["invoiceClientRisk"],
    queryFn: invoicesApi.getClientIntelligence,
    retry: false,
  });

  // Cash flow: receivables summary
  const cashFlowQuery = useQuery({
    queryKey: ["invoiceCashFlow"],
    queryFn: invoicesApi.getCashFlowIntelligence,
    retry: false,
  });

  // Normalize/merge backend data with local fallbacks
  const revenueData = normalizeRevenue(
    revenueMonthlyQuery.data,
    revenueTopClientsQuery.data,
    invoices
  );

  const collectionData = normalizeCollection(
    collectionPerfQuery.isError ? null : collectionPerfQuery.data,
    collectionRateQuery.isError ? null : collectionRateQuery.data,
    invoices
  );

  const rawClientData = clientRiskQuery.isError ? null : clientRiskQuery.data;
  const mergedClientData = normalizeClientData(rawClientData, invoices);

  const cashFlowData = normalizeCashFlow(
    cashFlowQuery.isError ? null : cashFlowQuery.data,
    invoices
  );

  // Concentration Risk
  const totalRevenue = revenueData?.totalRevenue || 1;
  const clientsWithConcentration = mergedClientData.map(client => ({
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
