'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, FunnelChart, Funnel, LabelList } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, Package, Truck, AlertTriangle, DollarSign, ShoppingCart, CheckCircle, XCircle, Clock, Activity, Eye, PackageCheck, MapPin, RotateCcw, Ban } from 'lucide-react';
import { format } from 'date-fns';
import DateRangePicker from '@/components/DateRangePicker';
import ExportButtons from '@/components/ExportButtons';
import WriteBackModal from '@/components/WriteBackModal';


const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function CWAGODashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });

  // Fetch complete dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
        endDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
      });

      const response = await fetch(`/api/dashboard?${params}`);
      const result = await response.json();

      if (result.success) {
        setDashboardData(result);
        setLastUpdated(result.lastUpdated);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Failed to connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Auto-refresh every 5 minutes (300 seconds)
  useEffect(() => {
    if (typeof window === 'undefined' || !autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 300000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Metric Card Component
  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color, format = 'number' }) => {
    const formatValue = (val) => {
      if (format === 'currency') return `₱${val?.toLocaleString()}` || '₱0';
      if (format === 'percent') return `${val?.toFixed(2)}%` || '0%';
      return val?.toLocaleString() || '0';
    };

    const formatSubtitle = (sub) => {
      if (!sub) return null;
      const parts = sub.split('₱');
      if (parts.length === 1) return sub;
      return (
        <>
          {parts[0]}
          <span style={{ color: '#00FF00' }}>₱{parts[1]}</span>
        </>
      );
    };

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{formatSubtitle(subtitle)}</p>}
          {trend && (
            <p className="text-xs flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={trend > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(trend).toFixed(1)}%
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  // Alert Badge Component
  const AlertBadge = ({ issue }) => {
    const priorityColors = {
      high: 'bg-red-500/10 text-red-500 border-red-500/20',
      medium: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      low: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    };

    return (
      <div className={`p-4 rounded-lg border ${priorityColors[issue.priority]}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{issue.type}</h4>
            <p className="text-xs mt-1">{issue.message}</p>
            <p className="text-xs mt-2 opacity-80">
              {issue.count} orders • {issue.amount ? `₱${issue.amount.toLocaleString()}` : ''}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Error loading dashboard</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Please check your Google Sheets credentials in .env
                </p>
              </div>
            </div>
            <Button onClick={fetchData} className="w-full mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, lifecycle, issues, financial, analytics } = dashboardData || {};

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">CWAGO Tracking Monitor</h1>
              <p className="text-muted-foreground">Real-time order tracking & analytics</p>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <div className="text-sm text-muted-foreground hidden md:block">
                  <Clock className="h-3 w-3 inline mr-1" />
                  {format(new Date(lastUpdated), 'MMM dd, HH:mm:ss')}
                </div>
              )}
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onApply={fetchData}
                loading={loading}
              />
            </div>
            <div className="flex items-center gap-4">
              <ExportButtons data={dashboardData} />
              <WriteBackModal />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Auto-refresh</span>
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                  aria-label="Toggle auto-refresh"
                />
              </div>
              <Button
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="issues">Issues & Alerts</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {overview && (
              <>
                {/* Overview Totals - 1 Row */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                  <MetricCard
                    title="Total Orders"
                    value={overview.totals?.totalOrders}
                    subtitle={`Period total`}
                    icon={ShoppingCart}
                    color="text-blue-500"
                  />
                  <MetricCard
                    title="Total Shipping Fee"
                    value={overview.totals?.totalSFAmount}
                    subtitle="Period total"
                    icon={Truck}
                    color="text-blue-500"
                    format="currency"
                  />
                  <MetricCard
                    title="Total Ad Spend"
                    value={overview.totals?.totalAdsSpent}
                    subtitle="Period total"
                    icon={TrendingUp}
                    color="text-purple-500"
                    format="currency"
                  />
                  <MetricCard
                    title="Total Gross Sale"
                    value={overview.totals?.totalRevenue}
                    subtitle="Period total"
                    icon={DollarSign}
                    color="text-green-500"
                    format="currency"
                  />
                </div>

                {/* Order Status Cards - 2 Rows with 5, 6 Cards */}
                <div className="space-y-4">
                  {/* Row 1: 5 Cards */}
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-5 lg:grid-cols-5">
                    <MetricCard
                      title="Pending Not Printed"
                      value={overview.totals?.pendingNotPrinted}
                      subtitle="Period total"
                      icon={Clock}
                      color="text-orange-500"
                    />
                    <MetricCard
                      title="Printed Waybill"
                      value={overview.totals?.printedWaybill}
                      subtitle="Period total"
                      icon={PackageCheck}
                      color="text-blue-500"
                    />
                    <MetricCard
                      title="Pending Printed Waybill"
                      value={overview.totals?.pendingPrintedWaybill}
                      subtitle="Period total"
                      icon={Package}
                      color="text-purple-500"
                    />
                    <MetricCard
                      title="Fulfilled"
                      value={overview.totals?.fulfilledOrder}
                      subtitle="Period total"
                      icon={CheckCircle}
                      color="text-green-500"
                    />
                    <MetricCard
                      title="In Transit"
                      value={overview.totals?.inTransit}
                      subtitle="Period total"
                      icon={Truck}
                      color="text-blue-500"
                    />
                  </div>

                  {/* Row 2: 6 Cards */}
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-6 lg:grid-cols-6">
                    <MetricCard
                      title="On Delivery"
                      value={overview.totals?.onDelivery}
                      subtitle="Period total"
                      icon={MapPin}
                      color="text-orange-500"
                    />
                    <MetricCard
                      title="Delivered"
                      value={overview.totals?.totalDelivered}
                      subtitle="Period total"
                      icon={CheckCircle}
                      color="text-green-500"
                    />
                    <MetricCard
                      title="Detained"
                      value={overview.totals?.detained}
                      subtitle="Period total"
                      icon={AlertTriangle}
                      color="text-red-500"
                    />
                    <MetricCard
                      title="Cancelled Orders"
                      value={overview.totals?.totalCancelled}
                      subtitle="Period total"
                      icon={Ban}
                      color="text-gray-500"
                    />
                    <MetricCard
                      title="Cancelled w/o Price"
                      value={overview.totals?.cancelledWithoutPrice}
                      subtitle="Period total"
                      icon={Ban}
                      color="text-gray-500"
                    />
                    <MetricCard
                      title="Returned"
                      value={overview.totals?.returned}
                      subtitle="Period total"
                      icon={RotateCcw}
                      color="text-orange-500"
                    />
                  </div>
                </div>

                {/* Order Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                    <CardDescription>Current order status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          { name: 'Pending Not Printed', value: overview.latest?.pendingNotPrinted || 0, amount: overview.totals?.pendingNotPrintedAmount || 0, percent: overview.totals?.pendingNotPrintedPercent || 0 },
                          { name: 'Printed Waybill', value: overview.latest?.printedWaybill || 0, amount: overview.totals?.printedWaybillAmount || 0, percent: overview.totals?.printedWaybillPercent || 0 },
                          { name: 'Pending Printed Waybill', value: overview.latest?.pendingPrintedWaybill || 0, amount: overview.totals?.pendingPrintedWaybillAmount || 0, percent: overview.totals?.pendingPrintedWaybillPercent || 0 },
                          { name: 'Fulfilled', value: overview.latest?.fulfilledOrder || 0, amount: overview.totals?.fulfilledOrderAmount || 0, percent: overview.totals?.fulfilledOrderPercent || 0 },
                          { name: 'In Transit', value: overview.latest?.inTransit || 0, amount: overview.totals?.inTransitAmount || 0, percent: overview.totals?.inTransitPercent || 0 },
                          { name: 'On Delivery', value: overview.latest?.onDelivery || 0, amount: overview.totals?.onDeliveryAmount || 0, percent: overview.totals?.onDeliveryPercent || 0 },
                          { name: 'Delivered', value: overview.latest?.delivered || 0, amount: overview.totals?.deliveredAmount || 0, percent: overview.totals?.deliveredPercent || 0 },
                          { name: 'Detained', value: overview.latest?.detained || 0, amount: overview.totals?.detainedAmount || 0, percent: overview.totals?.detainedPercent || 0 },
                          { name: 'Cancelled Orders', value: overview.latest?.cancelled || 0, amount: overview.totals?.cancelledAmount || 0, percent: overview.totals?.cancelledPercent || 0 },
                          { name: 'Cancelled w/o Price', value: overview.latest?.cancelledWithoutPrice || 0, amount: overview.totals?.cancelledWithoutPriceAmount || 0, percent: overview.totals?.cancelledWithoutPricePercent || 0 },
                          { name: 'Returned', value: overview.latest?.returned || 0, amount: overview.totals?.returnedAmount || 0, percent: overview.latest?.returnedPercent || 0 },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                        />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', padding: '8px' }}>
                                  <p style={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}>{label}</p>
                                  <p style={{ color: '#3b82f6' }}>Count: {data.value}</p>
                                  <p style={{ color: '#10b981' }}>Amount: ₱{data.amount?.toLocaleString()}</p>
                                  <p style={{ color: '#f59e0b' }}>Percentage: {data.percent?.toFixed(2)}%</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" name="Order Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Historical Totals */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Lifetime Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{overview.totals?.totalOrders?.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground mt-2">All time total</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Lifetime Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">₱{overview.totals?.totalRevenue?.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground mt-2">All time revenue</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Lifetime Delivered</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{overview.totals?.totalDelivered?.toLocaleString()}</div>
                      <p className="text-sm text-muted-foreground mt-2">Successfully delivered</p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>



          {/* ISSUES & ALERTS TAB */}
          <TabsContent value="issues" className="space-y-6">
            {issues && (
              <>
                {/* Active Alerts */}
                {issues.issues && issues.issues.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Active Alerts ({issues.issues.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {issues.issues.map((issue, index) => (
                        <AlertBadge key={index} issue={issue} />
                      ))}
                    </div>
                  </div>
                )}

                {issues.issues && issues.issues.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold">All Clear!</h3>
                      <p className="text-muted-foreground mt-2">No active alerts at this time</p>
                    </CardContent>
                  </Card>
                )}

                {/* Issue Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="border-red-500/20">
                    <CardHeader>
                      <CardTitle className="text-red-500">Detained Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{issues.detained?.count}</div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {issues.detained?.percent?.toFixed(2)}% • ₱{issues.detained?.amount?.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-500/20">
                    <CardHeader>
                      <CardTitle className="text-orange-500">Returned Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{issues.returned?.count}</div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {issues.returned?.percent?.toFixed(2)}% • ₱{issues.returned?.amount?.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-gray-500/20">
                    <CardHeader>
                      <CardTitle className="text-gray-500">Cancelled Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{issues.cancelled?.count}</div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {issues.cancelled?.percent?.toFixed(2)}% • ₱{issues.cancelled?.amount?.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="text-blue-500">Pending Not Printed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{issues.pendingNotPrinted?.count}</div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {issues.pendingNotPrinted?.percent?.toFixed(2)}% • ₱{issues.pendingNotPrinted?.amount?.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="text-purple-500">Pending Printed Waybill</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{issues.pendingPrintedWaybill?.count}</div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {issues.pendingPrintedWaybill?.percent?.toFixed(2)}% • ₱{issues.pendingPrintedWaybill?.amount?.toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-500/20">
                    <CardHeader>
                      <CardTitle className="text-yellow-500">Cancelled w/o Price</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{issues.cancelledWithoutPrice?.count}</div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {issues.cancelledWithoutPrice?.percent?.toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial" className="space-y-6">
            {financial && (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Gross Revenue"
                    value={financial.grossRevenue}
                    subtitle="Product sales"
                    icon={DollarSign}
                    color="text-green-500"
                    format="currency"
                  />
                  <MetricCard
                    title="Shipping Fees"
                    value={financial.shippingFees}
                    subtitle={`Avg: ₱${financial.avgShippingFee?.toFixed(2)}`}
                    icon={Truck}
                    color="text-blue-500"
                    format="currency"
                  />
                  <MetricCard
                    title="Ad Spend"
                    value={financial.adSpend}
                    subtitle={`CPA: ₱${financial.cpa?.toFixed(2)}`}
                    icon={TrendingUp}
                    color="text-purple-500"
                    format="currency"
                  />
                  <MetricCard
                    title="Net Revenue"
                    value={financial.netRevenue}
                    subtitle={`Margin: ${financial.profitMargin?.toFixed(2)}%`}
                    icon={DollarSign}
                    color="text-green-500"
                    format="currency"
                  />
                </div>

                {/* Financial Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Breakdown</CardTitle>
                    <CardDescription>Revenue, costs, and profitability ({financial.date})</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          {
                            name: 'Revenue',
                            'Gross Revenue': financial.grossRevenue,
                            'Shipping Fees': -financial.shippingFees,
                            'Ad Spend': -financial.adSpend,
                            'Net Revenue': financial.netRevenue,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))' }} />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Gross Revenue" fill="#10b981" />
                        <Bar dataKey="Shipping Fees" fill="#ef4444" />
                        <Bar dataKey="Ad Spend" fill="#f59e0b" />
                        <Bar dataKey="Net Revenue" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Key Ratios */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>Avg Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">₱{financial.avgOrderValue?.toFixed(2)}</div>
                      <p className="text-sm text-muted-foreground mt-2">Per order</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Profit Margin</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{financial.profitMargin?.toFixed(2)}%</div>
                      <p className="text-sm text-muted-foreground mt-2">After costs</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Cost Per Acquisition</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">₱{financial.cpa?.toFixed(2)}</div>
                      <p className="text-sm text-muted-foreground mt-2">Per order</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Delivered Orders Financial Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivered Orders Financial Metrics</CardTitle>
                    <CardDescription>Financial performance based only on successfully delivered parcels</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <MetricCard
                        title="Gross Revenue (Delivered)"
                        value={financial.delivered?.grossRevenue}
                        subtitle="Product sales from delivered orders (Column AJ)"
                        icon={DollarSign}
                        color="text-green-500"
                        format="currency"
                      />
                      <MetricCard
                        title="Shipping Fees (Delivered)"
                        value={financial.shippingFees}
                        subtitle={`Avg: ₱${financial.avgShippingFee?.toFixed(2)}`}
                        icon={Truck}
                        color="text-blue-500"
                        format="currency"
                      />
                      <MetricCard
                        title="Ad Spend (Delivered)"
                        value={financial.adSpend}
                        subtitle={`CPA: ₱${financial.cpa?.toFixed(2)}`}
                        icon={TrendingUp}
                        color="text-purple-500"
                        format="currency"
                      />
                      <MetricCard
                        title="Net Revenue (Delivered)"
                        value={financial.delivered?.netRevenue}
                        subtitle={`Margin: ${financial.delivered?.profitMargin?.toFixed(2)}%`}
                        icon={DollarSign}
                        color="text-green-500"
                        format="currency"
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            {analytics && (
              <>
                {/* Conversion Metrics */}
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    title="Delivery Rate"
                    value={analytics.metrics?.conversionRate}
                    subtitle="Orders delivered"
                    icon={CheckCircle}
                    color="text-green-500"
                    format="percent"
                  />
                  <MetricCard
                    title="Fulfillment Rate"
                    value={analytics.metrics?.fulfillmentRate}
                    subtitle="Orders fulfilled"
                    icon={PackageCheck}
                    color="text-blue-500"
                    format="percent"
                  />
                  <MetricCard
                    title="Success Rate"
                    value={analytics.metrics?.successRate}
                    subtitle="Excl. cancellations"
                    icon={TrendingUp}
                    color="text-purple-500"
                    format="percent"
                  />
                  <MetricCard
                    title="Avg Delivery"
                    value={analytics.metrics?.avgDeliveryRate}
                    subtitle="Historical average"
                    icon={Truck}
                    color="text-orange-500"
                    format="percent"
                  />
                </div>

                {/* Trend Charts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Order Volume Trends</CardTitle>
                    <CardDescription>Last 30 days order tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={analytics.trends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'hsl(var(--foreground))' }}
                        />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="totalOrders"
                          stackId="1"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          name="Total Orders"
                        />
                        <Area
                          type="monotone"
                          dataKey="delivered"
                          stackId="2"
                          stroke="#10b981"
                          fill="#10b981"
                          name="Delivered"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Performance Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Performance Trends</CardTitle>
                    <CardDescription>Track delivery rates over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analytics.trends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'hsl(var(--foreground))' }}
                        />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="deliveredPercent"
                          stroke="#10b981"
                          strokeWidth={2}
                          name="Delivery %"
                        />
                        <Line
                          type="monotone"
                          dataKey="inTransit"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          name="In Transit"
                        />
                        <Line
                          type="monotone"
                          dataKey="detained"
                          stroke="#ef4444"
                          strokeWidth={2}
                          name="Detained"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Revenue Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue & Ad Spend Trends</CardTitle>
                    <CardDescription>Track revenue and marketing costs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={analytics.trends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'hsl(var(--foreground))' }}
                        />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={3}
                          name="Revenue"
                        />
                        <Line
                          type="monotone"
                          dataKey="adsSpent"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="Ad Spend"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>


        </Tabs>
      </main>
    </div>
  );
}
