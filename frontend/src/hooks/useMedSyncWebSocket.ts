'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SimulationState, EventLog, RaceExperimentResult } from '../lib/types';
import { fetchSimulationState } from '../lib/api';

const DEFAULT_STATE: SimulationState = {
  simulation_running: false,
  simulation_paused: false,
  metrics: {
    uptime_seconds: 0,
    total_messages: 0,
    total_alerts: 0,
    total_assignments: 0,
    sync_errors: 0,
    critical_patients: 0,
    available_doctors: 4,
    active_processes: 0,
  },
  patients: [],
  doctors: [],
  workers: [],
  recent_events: [],
  race_history: [],
  system_time: Date.now() / 1000,
};

export function useMedSyncWebSocket() {
  const [state, setState] = useState<SimulationState>(DEFAULT_STATE);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadInitialState = useCallback(async () => {
    try {
      const data = await fetchSimulationState();
      setState(data);
      setLastUpdatedTime(new Date());
    } catch (err) {
      console.warn('Initial fetch failed, will retry over WebSocket/polling', err);
    }
  }, []);

  useEffect(() => {
    loadInitialState();

    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      setConnectionStatus('CONNECTING');

      try {
        const ws = new WebSocket('ws://localhost:8000/ws');
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setConnectionStatus('CONNECTED');
          setLastUpdatedTime(new Date());
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const parsed = JSON.parse(event.data);
            setLastUpdatedTime(new Date());

            if (parsed.event === 'INIT_STATE' && parsed.data) {
              setState(parsed.data);
            } else if (parsed.event === 'RACE_EXPERIMENT_COMPLETED' && parsed.result) {
              setState((prev) => ({
                ...prev,
                race_history: [parsed.result, ...prev.race_history.slice(0, 9)],
              }));
            } else {
              // Refresh full state on events
              fetchSimulationState().then((fresh) => {
                if (isMounted) setState(fresh);
              }).catch(() => {});
            }
          } catch (e) {
            console.error('WS Parse Error', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setConnectionStatus('DISCONNECTED');
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setConnectionStatus('DISCONNECTED');
          ws.close();
        };
      } catch (err) {
        setConnectionStatus('DISCONNECTED');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    }

    connect();

    // Fallback polling interval every 2.5s for seamless consistency
    const pollInterval = setInterval(() => {
      fetchSimulationState().then((fresh) => {
        if (isMounted) {
          setState(fresh);
          setLastUpdatedTime(new Date());
        }
      }).catch(() => {});
    }, 2500);

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pollInterval);
    };
  }, [loadInitialState]);

  return { state, connectionStatus, lastUpdatedTime, refreshState: loadInitialState };
}
