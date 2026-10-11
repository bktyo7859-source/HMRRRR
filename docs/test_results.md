# MedSync — Test Verification & Benchmark Results

## 1. Test Suite Summary
**Test Runner:** Python `unittest` (`tests/test_medsync.py`)  
**Execution Timestamp:** 2026-10-11T18:06:02+05:30  
**Status:** **10/10 Tests Passed (OK)**  
**Duration:** 0.228s  

---

## 2. Test Execution Matrix

| Test ID | Test Target | Mode | Expected Invariant | Measured Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `test_01` | Binary Verification | Native | Binary exists & compiled with static linking | `medsync_sim.exe` verified | **PASS** |
| `test_02` | Exp 1: Duplicate Claim | UNSAFE | Invariant Violated (TOCTOU double claim) | `worker1_claimed=1, worker2_claimed=1` | **PASS** |
| `test_03` | Exp 1: Duplicate Claim | PROTECTED | Exactly 1 doctor claims, second rejected | `worker1=1, worker2=0 (total=1)` | **PASS** |
| `test_04` | Exp 2: Lost Counter | UNSAFE | Actual < Target (20,000), Lost > 0 | `actual=11,588, lost=8,412 (42.0%)` | **PASS** |
| `test_05` | Exp 2: Lost Counter | PROTECTED | Actual == Target (20,000), Lost == 0 | `actual=20,000, lost=0 (100.0%)` | **PASS** |
| `test_06` | Exp 3: Status Transition | UNSAFE | Corrupted lifecycle overwrite | Invariant Violated | **PASS** |
| `test_07` | Exp 3: Status Transition | PROTECTED | Invalid transition rejected by mutex | Invariant Preserved | **PASS** |
| `test_08` | System Info API | REST | Introspection of OS and executable | `200 OK`, verified binary info | **PASS** |
| `test_09` | Race Run API | REST | Endpoint executes C++ binary | `200 OK`, returned exact JSON | **PASS** |
| `test_10` | Manual Emergency API | REST | Dispatches typed alert to shared state | `200 OK`, Patient #4 elevated to P1 | **PASS** |

---

## 3. Empirical Concurrency Benchmark Outputs

### Benchmark A: Lost-Update Counter (2 Workers $\times$ 10,000 increments)
```json
{
  "test_type": 2,
  "mode": "UNSAFE",
  "target_counter": 20000,
  "actual_counter": 11588,
  "lost_updates": 8412,
  "duration_ms": 0.5663,
  "worker1_pid": 24792,
  "worker2_pid": 24793,
  "invariant_violated": true,
  "summary": "LOST UPDATES DETECTED: Expected 20000, but observed actual count of 11588 (8412 increments lost to race condition).",
  "details": {
    "expected": 20000,
    "actual": 11588,
    "lost": 8412,
    "efficiency_loss_pct": 42.06
  }
}
```

```json
{
  "test_type": 2,
  "mode": "PROTECTED",
  "target_counter": 20000,
  "actual_counter": 20000,
  "lost_updates": 0,
  "duration_ms": 35.6272,
  "worker1_pid": 68008,
  "worker2_pid": 68009,
  "invariant_violated": false,
  "summary": "PERFECT SYNCHRONIZATION: Target matched actual (20,000 / 20,000 increments, 0 lost updates).",
  "details": {
    "expected": 20000,
    "actual": 20000,
    "lost": 0,
    "efficiency_loss_pct": 0.0
  }
}
```

### Benchmark B: Duplicate Claim Race (TOCTOU Experiment)
```json
{
  "test_type": 1,
  "mode": "UNSAFE",
  "worker1_claimed": 1,
  "worker2_claimed": 1,
  "invariant_violated": true,
  "summary": "CRITICAL RACE DETECTED: TOCTOU race condition occurred! Both Doctor #1 and Doctor #2 observed WAITING and claimed Patient #1 simultaneously.",
  "details": {
    "patient_id": 1,
    "final_doctor_id": 1,
    "w1_success": true,
    "w2_success": true
  }
}
```

```json
{
  "test_type": 1,
  "mode": "PROTECTED",
  "worker1_claimed": 1,
  "worker2_claimed": 0,
  "invariant_violated": false,
  "summary": "MUTUAL EXCLUSION ENFORCED: Exactly one doctor claimed Patient #1; second claim was safely rejected by semaphore check.",
  "details": {
    "patient_id": 1,
    "final_doctor_id": 1,
    "w1_success": true,
    "w2_success": false
  }
}
```
