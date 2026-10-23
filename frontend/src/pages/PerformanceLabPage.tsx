import React, { useState, useEffect, useCallback } from 'react';
import {
  Gauge,
  Activity,
  Cpu,
  Database,
  Zap,
  Play,
  RotateCw,
  TrendingUp,
  Clock,
  AlertTriangle,
  X,
} from 'lucide-react';
import { performanceService } from '../services/performanceService';
import type {
  SystemMetrics,
  BenchmarkScenario,
  BenchmarkRunType,
  BenchmarkResult,
  BenchmarkComparison,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatDateTime } from '../utils/format';
import { SupabaseSetupModal } from '../components/SupabaseSetupModal';

export const PerformanceLabPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isConfigured = performanceService.isConfigured();

  // Metrics State
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Comparisons State
  const [comparisons, setComparisons] = useState<BenchmarkComparison[]>([]);

  // History State
  const [history, setHistory] = useState<BenchmarkResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Benchmark Form State
  const [scenario, setScenario] = useState<BenchmarkScenario>('DASHBOARD_METRICS');
  const [runType] = useState<BenchmarkRunType>('OPTIMIZED');
  const [virtualUsers, setVirtualUsers] = useState<number>(5);
  const [iterations, setIterations] = useState<number>(50);
  const [notes, setNotes] = useState<string>('');
  const [confirmedGuardrail, setConfirmedGuardrail] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [lastExecutedResult, setLastExecutedResult] = useState<BenchmarkResult | null>(null);

  // Detail Modal
  const [selectedDetail, setSelectedDetail] = useState<BenchmarkResult | null>(null);

  // Fetch real-time telemetry metrics
  const fetchMetrics = useCallback(async (isSilent = false) => {
    if (!isSilent) setMetricsLoading(true);
    try {
      const data = await performanceService.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      if (!isSilent) showError(err.message || 'Không thể lấy thông số telemetry');
    } finally {
      if (!isSilent) setMetricsLoading(false);
    }
  }, [showError]);

  // Fetch comparisons
  const fetchComparisons = useCallback(async () => {
    try {
      const data = await performanceService.getComparisons();
      setComparisons(data);
    } catch (err: any) {
      showError(err.message || 'Không thể tải bảng so sánh hiệu năng');
    }
  }, [showError]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      if (isConfigured) {
        const hist = await performanceService.getHistory();
        setHistory(hist);
      } else {
        setHistory([
          {
            runUuid: 'sample-run-001',
            scenarioName: 'DASHBOARD_METRICS',
            scenarioDisplayName: 'Thống kê tổng hợp Dashboard (Composite Index)',
            runType: 'OPTIMIZED',
            environment: 'Supabase PostgreSQL (Indexed)',
            virtualUsers: 5,
            iterations: 50,
            totalRequests: 50,
            successfulRequests: 50,
            failedRequests: 0,
            durationMs: 342,
            throughputRps: 146.2,
            minLatencyMs: 3.1,
            avgLatencyMs: 6.8,
            p50LatencyMs: 5.9,
            p95LatencyMs: 12.4,
            p99LatencyMs: 15.0,
            maxLatencyMs: 18.2,
            errorRate: 0,
            executedBy: 'Benchmark Engine',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      showError(err.message || 'Không thể tải lịch sử kiểm thử');
    } finally {
      setHistoryLoading(false);
    }
  }, [isConfigured, showError]);

  useEffect(() => {
    let active = true;
    if (active) {
      fetchMetrics();
      fetchComparisons();
      fetchHistory();
    }
    return () => {
      active = false;
    };
  }, [fetchMetrics, fetchComparisons, fetchHistory]);

  // Auto refresh telemetry
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  // Execute benchmark
  const handleRunBenchmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showError('Chỉ Quản trị viên (ROLE_ADMIN) mới có quyền chạy benchmark!');
      return;
    }
    if (!confirmedGuardrail) {
      showError('Vui lòng xác nhận môi trường đo kiểm và giới hạn tải');
      return;
    }

    setExecuting(true);
    try {
      const res = await performanceService.runBenchmark({
        scenario,
        runType,
        virtualUsers,
        iterations,
        environment: isConfigured ? 'Supabase Cloud (PostgreSQL)' : 'Trình duyệt (Preview Client)',
        notes: notes || undefined,
      });

      setLastExecutedResult(res);
      showSuccess(`Hoàn thành phiên kiểm thử "${res.scenarioDisplayName}": Avg ${res.avgLatencyMs}ms, Throughput ${res.throughputRps} req/s`);
      fetchHistory();
      fetchMetrics(true);
    } catch (err: any) {
      showError(err.message || 'Lỗi trong quá trình chạy kiểm chuẩn');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div id="performance-lab-container">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Gauge size={26} color="#2563eb" />
            <span>Phòng Thí Nghiệm Hiệu Năng & Giám Sát (Performance Lab)</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
            Đo lường độ trễ (RTT, P50, P95), kiểm thử tải thực tế trên Supabase và theo dõi tài nguyên hệ thống
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="btn btn-secondary btn-sm"
            style={{
              backgroundColor: autoRefresh ? '#f0fdf4' : '#f8fafc',
              borderColor: autoRefresh ? '#86efac' : '#cbd5e1',
              color: autoRefresh ? '#15803d' : '#64748b',
            }}
          >
            <RotateCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
            <span>Auto Refresh: {autoRefresh ? 'BẬT (8s)' : 'TẮT'}</span>
          </button>
          <button
            onClick={() => fetchMetrics(false)}
            disabled={metricsLoading}
            className="btn btn-primary btn-sm"
          >
            <span>Đo lại RTT</span>
          </button>
        </div>
      </div>

      {/* Supabase Notice */}
      {!isConfigured && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '0.85rem' }}>
            <AlertTriangle size={18} color="#d97706" />
            <span>
              <strong>Chế độ xem trước:</strong> Chưa có thông tin kết nối Supabase trong file <code>.env</code>. Bạn có thể chạy kiểm chuẩn thử nghiệm mô phỏng độ trễ trình duyệt, hoặc cấu hình Supabase để đo lường PostgreSQL RTT thật.
            </span>
          </div>
          <button
            onClick={() => setShowSetupModal(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#d97706',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Xem hướng dẫn kết nối
          </button>
        </div>
      )}

      {/* Real-time Telemetry Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* Metric 1: CPU / Cores */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>CPU Concurrency</span>
            <Cpu size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0f172a' }}>
            {metrics?.availableProcessors || navigator.hardwareConcurrency || 4} Cores
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Luồng xử lý phần cứng
          </div>
        </div>

        {/* Metric 2: Supabase Round-Trip Latency */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Độ trễ Ping RTT</span>
            <Activity size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#16a34a' }}>
            {metrics?.avgLatencyMs ? `${metrics.avgLatencyMs} ms` : isConfigured ? 'Đang đo...' : '12.4 ms'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>
            Mục tiêu SLO: &lt; 150ms
          </div>
        </div>

        {/* Metric 3: Database Engine */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Cơ sở dữ liệu</span>
            <Database size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>
            {isConfigured ? 'Supabase' : 'Preview Mode'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            PostgreSQL 16 + RLS
          </div>
        </div>

        {/* Metric 4: Target SLO P95 */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Target SLO P95</span>
            <Zap size={18} color="#9333ea" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#9333ea' }}>
            &lt; 400 ms
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            Tiêu chuẩn phản hồi tối ưu
          </div>
        </div>
      </div>

      {/* Main Grid: Execution Form + Comparison Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Benchmark Trigger Form */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={18} color="#2563eb" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              Khởi động phiên đo kiểm hiệu năng
            </h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleRunBenchmark}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Kịch bản đo kiểm (Scenario)
                </label>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value as BenchmarkScenario)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                >
                  <option value="DASHBOARD_METRICS">1. Tổng hợp Dashboard KPIs (Exact Count & Aggregations)</option>
                  <option value="CUSTOMER_SEARCH">2. Tìm kiếm khách hàng theo chỉ mục (Indexed Search)</option>
                  <option value="DEAL_PIPELINE_FILTER">3. Lọc đường ống cơ hội bán hàng (Deal Pipeline Filter)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Số lần lặp (Iterations)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={iterations}
                    onChange={(e) => setIterations(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Người dùng ảo (Virtual Users)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={virtualUsers}
                    onChange={(e) => setVirtualUsers(Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Ghi chú phiên kiểm thử
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ví dụ: Đo kiểm sau khi gắn Composite Index..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="confirm-guardrail"
                  checked={confirmedGuardrail}
                  onChange={(e) => setConfirmedGuardrail(e.target.checked)}
                />
                <label htmlFor="confirm-guardrail" style={{ fontSize: '0.82rem', color: '#475569' }}>
                  Xác nhận môi trường đo kiểm an toàn và giới hạn tần suất yêu cầu
                </label>
              </div>

              <button
                type="submit"
                disabled={executing || !isAdmin}
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {executing ? (
                  <>
                    <div className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                    <span>Đang đo kiểm ({iterations} requests)...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span>Bắt đầu đo kiểm hiệu năng</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Latest Run Results Card */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#16a34a" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
              Kết quả phiên đo gần nhất
            </h3>
          </div>
          <div className="card-body">
            {lastExecutedResult ? (
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  {lastExecutedResult.scenarioDisplayName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Avg Latency</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>{lastExecutedResult.avgLatencyMs} ms</div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>P95 Latency</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#9333ea' }}>{lastExecutedResult.p95LatencyMs} ms</div>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Throughput</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#16a34a' }}>{lastExecutedResult.throughputRps} rps</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Min: {lastExecutedResult.minLatencyMs}ms | Max: {lastExecutedResult.maxLatencyMs}ms</span>
                  <span>Tỷ lệ lỗi: {lastExecutedResult.errorRate}%</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <Clock size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                <span>Chưa có phiên đo kiểm nào được thực hiện trong phiên làm việc hiện tại. Hãy bấm &quot;Bắt đầu đo kiểm hiệu năng&quot; ở bên trái.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparisons Section */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
            Đối chuẩn cải thiện hiệu năng (Baseline vs Optimized)
          </h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Kịch bản đo kiểm</th>
                  <th style={{ textAlign: 'center' }}>Cải thiện P50</th>
                  <th style={{ textAlign: 'center' }}>Cải thiện P95</th>
                  <th style={{ textAlign: 'center' }}>Cải thiện Độ trễ TB</th>
                  <th style={{ textAlign: 'center' }}>Tăng thông lượng (RPS)</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c) => (
                  <tr key={c.scenario}>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.scenarioDisplayName}</td>
                    <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>+{c.p50ImprovementPct}%</td>
                    <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>+{c.p95ImprovementPct}%</td>
                    <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>+{c.avgLatencyImprovementPct}%</td>
                    <td style={{ textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>+{c.throughputImprovementPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Benchmark History Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
            Lịch sử đo lường hiệu năng gần đây
          </h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Mã phiên</th>
                  <th>Kịch bản</th>
                  <th>Môi trường</th>
                  <th>Iterations</th>
                  <th>Avg (ms)</th>
                  <th>P95 (ms)</th>
                  <th>Throughput</th>
                  <th>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px' }}>
                      <div className="loading-spinner"></div>
                    </td>
                  </tr>
                ) : history.length > 0 ? (
                  history.map((h) => (
                    <tr key={h.runUuid} style={{ cursor: 'pointer' }} onClick={() => setSelectedDetail(h)}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#2563eb' }}>{h.runUuid.substring(0, 14)}...</td>
                      <td style={{ fontWeight: 600 }}>{h.scenarioDisplayName}</td>
                      <td>{h.environment}</td>
                      <td>{h.iterations} reqs</td>
                      <td style={{ fontWeight: 600 }}>{h.avgLatencyMs} ms</td>
                      <td style={{ fontWeight: 600, color: '#9333ea' }}>{h.p95LatencyMs} ms</td>
                      <td style={{ color: '#16a34a', fontWeight: 600 }}>{h.throughputRps} rps</td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDateTime(h.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                      Chưa có dữ liệu lịch sử đo kiểm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Benchmark Detail Modal */}
      {selectedDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '20px',
          }}
          onClick={() => setSelectedDetail(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                Chi tiết phiên đo: {selectedDetail.runUuid}
              </h3>
              <button onClick={() => setSelectedDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
              <div><strong>Kịch bản:</strong> {selectedDetail.scenarioDisplayName}</div>
              <div><strong>Môi trường:</strong> {selectedDetail.environment}</div>
              <div><strong>Số requests:</strong> {selectedDetail.totalRequests}</div>
              <div><strong>Throughput:</strong> {selectedDetail.throughputRps} rps</div>
              <div><strong>Avg Latency:</strong> {selectedDetail.avgLatencyMs} ms</div>
              <div><strong>P50 Latency:</strong> {selectedDetail.p50LatencyMs} ms</div>
              <div><strong>P95 Latency:</strong> {selectedDetail.p95LatencyMs} ms</div>
              <div><strong>P99 Latency:</strong> {selectedDetail.p99LatencyMs} ms</div>
              <div><strong>Min / Max:</strong> {selectedDetail.minLatencyMs}ms / {selectedDetail.maxLatencyMs}ms</div>
              <div><strong>Tỷ lệ lỗi:</strong> {selectedDetail.errorRate}%</div>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setSelectedDetail(null)} className="btn btn-secondary btn-sm">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <SupabaseSetupModal isOpen={showSetupModal} onClose={() => setShowSetupModal(false)} />
    </div>
  );
};
