import json
import urllib.request
import urllib.error

base_url = "http://127.0.0.1:8000"

def get(path):
    req = urllib.request.Request(f"{base_url}{path}")
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read().decode())

def post(path, body):
    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(f"{base_url}{path}", data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

# Reset simulation to clean state first
post("/api/simulation/reset", {})

print("--- Testing /api/doctors ---")
status, docs = get("/api/doctors")
assert status == 200
print(f"Total doctors returned: {len(docs)}")
assert len(docs) == 8, f"Expected 8 doctors, got {len(docs)}"
for d in docs:
    print(f"MD #{d['id']}: {d['name']} | {d['specialization']} | {d['department']} | status: {d['status']} | img: {d['image']}")

print("\n--- Testing /api/assignments ---")
status, assignments_info = get("/api/assignments")
assert status == 200
print(f"Total assigned: {assignments_info['total_assigned']}, unassigned: {assignments_info['total_unassigned']}")

print("\n--- Testing Valid Assignment: Doctor #1 to Patient #1 ---")
status, res = post("/api/assignments/assign", {"patient_id": 1, "doctor_id": 1})
print(f"Assign status code: {status}")
print(f"Assign response: {res}")
assert status == 200

print("\n--- Testing Mutual Exclusion: Attempting to assign busy Doctor #1 to Patient #2 ---")
status, res = post("/api/assignments/assign", {"patient_id": 2, "doctor_id": 1})
print(f"Conflict response code: {status}")
print(f"Conflict response detail: {res}")
assert status == 400

print("\n--- Testing Mutual Exclusion: Attempting to assign Doctor #2 to already claimed Patient #1 ---")
status, res = post("/api/assignments/assign", {"patient_id": 1, "doctor_id": 2})
print(f"Duplicate claim response code: {status}")
print(f"Duplicate claim response detail: {res}")
assert status == 400

print("\n--- Testing Release Assignment for Doctor #1 ---")
status, res = post("/api/assignments/release", {"doctor_id": 1, "patient_id": 1})
print(f"Release response code: {status}")
print(f"Release response: {res}")
assert status == 200

print("\n--- Verification: Checking Doctor #1 is now Available ---")
status, doc1 = get("/api/doctors/1")
print(f"Doc #1 status: {doc1['status']} (0=AVAILABLE), treated: {doc1['patients_treated_count']}")
assert doc1["status"] == 0
assert doc1["current_patient_id"] == -1

print("\n=== ALL TESTS PASSED SUCCESSFULLY! ===")
