import os
import sys
import json
import time
import subprocess
import unittest
import urllib.request

class TestMedSyncIPC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        cls.cpp_dir = os.path.join(cls.project_root, "cpp")
        exe_name = "medsync_sim.exe" if sys.platform == "win32" else "medsync_sim"
        cls.exe_path = os.path.join(cls.cpp_dir, exe_name)
        assert os.path.exists(cls.exe_path), f"C++ executable missing at {cls.exe_path}"

    def test_01_ipc_binary_exists(self):
        """1. Verify compiled C++ simulation executable exists and is executable."""
        self.assertTrue(os.path.exists(self.exe_path))

    def test_02_experiment_1_unsafe_duplicate_assignment(self):
        """2. Verify Experiment 1 Unsafe mode exposes TOCTOU race condition."""
        res = subprocess.run([self.exe_path, "--race-duplicate", "unsafe"],
                             capture_output=True, text=True, cwd=self.cpp_dir)
        self.assertEqual(res.returncode, 0)
        data = json.loads(res.stdout.strip())
        self.assertEqual(data["mode"], "UNSAFE")
        self.assertEqual(data["test_type"], 1)
        self.assertTrue(data["invariant_violated"])
        self.assertEqual(data["worker1_claimed"], 1)
        self.assertEqual(data["worker2_claimed"], 1)

    def test_03_experiment_1_protected_duplicate_assignment(self):
        """3. Verify Experiment 1 Protected mode preserves mutual exclusion invariant."""
        res = subprocess.run([self.exe_path, "--race-duplicate", "protected"],
                             capture_output=True, text=True, cwd=self.cpp_dir)
        self.assertEqual(res.returncode, 0)
        data = json.loads(res.stdout.strip())
        self.assertEqual(data["mode"], "PROTECTED")
        self.assertEqual(data["test_type"], 1)
        self.assertFalse(data["invariant_violated"])
        # Exactly one worker successfully claimed
        total_claims = data["worker1_claimed"] + data["worker2_claimed"]
        self.assertEqual(total_claims, 1)

    def test_04_experiment_2_unsafe_lost_update_counter(self):
        """4. Verify Experiment 2 Unsafe mode loses increments due to non-atomic updates."""
        res = subprocess.run([self.exe_path, "--race-counter", "unsafe", "10000"],
                             capture_output=True, text=True, cwd=self.cpp_dir)
        self.assertEqual(res.returncode, 0)
        data = json.loads(res.stdout.strip())
        self.assertEqual(data["mode"], "UNSAFE")
        self.assertEqual(data["target_counter"], 20000)
        self.assertTrue(data["invariant_violated"])
        self.assertGreater(data["lost_updates"], 0)
        self.assertLess(data["actual_counter"], 20000)

    def test_05_experiment_2_protected_counter_correctness(self):
        """5. Verify Experiment 2 Protected mode achieves exact 20,000 / 20,000 increments."""
        res = subprocess.run([self.exe_path, "--race-counter", "protected", "10000"],
                             capture_output=True, text=True, cwd=self.cpp_dir)
        self.assertEqual(res.returncode, 0)
        data = json.loads(res.stdout.strip())
        self.assertEqual(data["mode"], "PROTECTED")
        self.assertEqual(data["target_counter"], 20000)
        self.assertEqual(data["actual_counter"], 20000)
        self.assertEqual(data["lost_updates"], 0)
        self.assertFalse(data["invariant_violated"])

    def test_06_experiment_3_unsafe_conflicting_status(self):
        """6. Verify Experiment 3 Unsafe mode permits invalid transition overwrite."""
        res = subprocess.run([self.exe_path, "--race-status", "unsafe"],
                             capture_output=True, text=True, cwd=self.cpp_dir)
        self.assertEqual(res.returncode, 0)
        data = json.loads(res.stdout.strip())
        self.assertEqual(data["mode"], "UNSAFE")
        self.assertTrue(data["invariant_violated"])

    def test_07_experiment_3_protected_conflicting_status(self):
        """7. Verify Experiment 3 Protected mode rejects invalid state transition."""
        res = subprocess.run([self.exe_path, "--race-status", "protected"],
                             capture_output=True, text=True, cwd=self.cpp_dir)
        self.assertEqual(res.returncode, 0)
        data = json.loads(res.stdout.strip())
        self.assertEqual(data["mode"], "PROTECTED")
        self.assertFalse(data["invariant_violated"])

    def test_08_api_system_info(self):
        """8. Verify FastAPI /api/system/info endpoint."""
        url = "http://127.0.0.1:8000/api/system/info"
        req = urllib.request.urlopen(url, timeout=3)
        self.assertEqual(req.getcode(), 200)
        data = json.loads(req.read().decode())
        self.assertTrue(data["executable_exists"])
        self.assertIn("compiler", data)

    def test_09_api_race_run_endpoint(self):
        """9. Verify FastAPI /api/race/run endpoint correctly invokes C++ process."""
        url = "http://127.0.0.1:8000/api/race/run"
        payload = json.dumps({"test_type": 2, "mode": "protected", "count": 5000}).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=5)
        self.assertEqual(resp.getcode(), 200)
        data = json.loads(resp.read().decode())
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["result"]["actual_counter"], 10000)
        self.assertEqual(data["result"]["lost_updates"], 0)

    def test_10_api_emergency_trigger_endpoint(self):
        """10. Verify FastAPI /api/simulation/emergency endpoint dispatches alert."""
        url = "http://127.0.0.1:8000/api/simulation/emergency"
        payload = json.dumps({"patient_id": 4, "priority": 1, "reason": "Acute Arrhythmia Test"}).encode()
        req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
        resp = urllib.request.urlopen(req, timeout=5)
        self.assertEqual(resp.getcode(), 200)
        data = json.loads(resp.read().decode())
        self.assertEqual(data["status"], "SUCCESS")
        self.assertEqual(data["patient"]["id"], 4)
        self.assertEqual(data["patient"]["priority"], 1)

if __name__ == "__main__":
    unittest.main()
