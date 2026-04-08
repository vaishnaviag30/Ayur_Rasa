"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FiPlus, FiUsers, FiActivity, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import Navbar from "../components/Navbar";
import { getAuthUser, getAuthToken, clearAuthSession, patientApi } from "../lib/api";

type Patient = {
  id: string;
  name: string;
  age?: number;
  sex?: "M" | "F" | "O";
  dosha: "Vata" | "Pitta" | "Kapha" | "Mixed";
  status: "On Plan" | "Follow-up Due" | "New" | "Completed";
  adherence?: number;
};

type NewPatientForm = {
  name: string;
  email: string;
  password: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  dosha: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(getAuthUser());
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [doshaFilter, setDoshaFilter] = useState<"" | Patient["dosha"]>("");
  const [statusFilter, setStatusFilter] = useState<"" | Patient["status"]>("");
  const [showAdd, setShowAdd] = useState(false);
  const [newPatient, setNewPatient] = useState<NewPatientForm>({
    name: "",
    email: "",
    password: "patient123",
    age: 25,
    gender: "Male",
    height: 165,
    weight: 60,
    dosha: "Vata",
  });
  const [message, setMessage] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [assessmentDone, setAssessmentDone] = useState<boolean>(false);
  const [dietPlanAssigned, setDietPlanAssigned] = useState<boolean>(false);
  const [patientStatusLoading, setPatientStatusLoading] = useState<boolean>(false);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const storedUser = getAuthUser();
    if (!storedUser) {
      clearAuthSession();
      router.replace('/login');
      return;
    }

    setUser(storedUser);
    setIsLoading(false);
  }, [router]);

  type RawDoctorPatient = {
    id: string;
    user?: { name?: string };
    age?: number;
    gender?: string;
    dosha?: string;
  };

  useEffect(() => {
    if (!user || user.role !== 'DOCTOR') return;

    async function fetchPatients() {
      const response = await patientApi.getDoctorPatients();
      if (response.success && response.data) {
        const doctorPatients = ((response.data as { patients?: unknown }).patients ?? []) as RawDoctorPatient[];
        const normalized = doctorPatients.map((patient) => ({
          id: patient.id,
          name: patient.user?.name || 'Unnamed Patient',
          age: patient.age || undefined,
          sex: (
            patient.gender === 'Male'
              ? 'M'
              : patient.gender === 'Female'
              ? 'F'
              : 'O'
          ) as Patient['sex'],
          dosha: (patient.dosha as Patient['dosha']) || 'Vata',
          status: 'New' as Patient['status'],
          adherence: 0,
        }));
        setPatients(normalized);
      } else {
        setPatients([]);
      }
    }

    fetchPatients();
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'PATIENT') return;

    const loadPatientStatus = async () => {
      setPatientStatusLoading(true);
      const response = await patientApi.getMyProfile();
      if (response.success && response.data?.patient) {
        const patient = response.data.patient as {
          assessments?: unknown;
          dietPlans?: unknown;
        };
        setAssessmentDone(
          Array.isArray(patient.assessments) && patient.assessments.length > 0
        );
        setDietPlanAssigned(
          Array.isArray(patient.dietPlans) && patient.dietPlans.length > 0
        );
      }
      setPatientStatusLoading(false);
    };

    loadPatientStatus();
  }, [user]);

  const filteredPatients = useMemo(
    () =>
      patients.filter((patient) => {
        if (query && !patient.name.toLowerCase().includes(query.toLowerCase())) return false;
        if (doshaFilter && patient.dosha !== doshaFilter) return false;
        if (statusFilter && patient.status !== statusFilter) return false;
        return true;
      }),
    [patients, query, doshaFilter, statusFilter]
  );

  const totals = useMemo(
    () => ({
      totalPatients: patients.length,
      activePlans: patients.filter((p) => p.status === 'On Plan').length,
      followUps: patients.filter((p) => p.status === 'Follow-up Due').length,
      alerts: patients.filter((p) => (p.adherence ?? 0) < 50).length,
    }),
    [patients]
  );

  const handleAddPatient = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    setMessage('');

    if (!newPatient.name.trim() || !newPatient.email.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    const response = await patientApi.createPatient({
      email: newPatient.email,
      name: newPatient.name,
      password: newPatient.password,
      age: newPatient.age,
      gender: newPatient.gender,
      height: newPatient.height,
      weight: newPatient.weight,
      dosha: newPatient.dosha,
    });

    if (!response.success) {
      setFormError(response.message || 'Unable to add patient.');
      return;
    }

    const patient = (response.data as { patient?: {
      id: string;
      user: { name: string };
      age?: number;
      gender?: string;
      dosha?: string;
    } }).patient;
    if (patient) {
      setPatients((current) => [
        {
          id: patient.id,
          name: patient.user.name,
          age: patient.age,
          sex: (
            patient.gender === 'Male'
              ? 'M'
              : patient.gender === 'Female'
              ? 'F'
              : 'O'
          ) as Patient['sex'],
          dosha: (patient.dosha as Patient['dosha']) || 'Vata',
          status: 'New' as Patient['status'],
          adherence: 0,
        },
        ...current,
      ]);
      setShowAdd(false);
      setNewPatient({
        name: '',
        email: '',
        password: 'patient123',
        age: 25,
        gender: 'Male',
        height: 165,
        weight: 60,
        dosha: 'Vata',
      });
      setMessage('Patient added successfully.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === 'PATIENT') {
    const assessmentTitle = assessmentDone ? 'Completed' : 'Pending';
    const assessmentNote = assessmentDone
      ? 'Your assessment has been completed.'
      : 'Complete the quiz to generate your plan.';

    const dietPlanTitle = dietPlanAssigned ? 'Ready' : assessmentDone ? 'Awaiting plan' : 'Not assigned';
    const dietPlanNote = dietPlanAssigned
      ? 'Your weekly diet plan is ready. View your diet plan now.'
      : assessmentDone
      ? 'Assessment done. Your plan will appear once assigned.'
      : 'Your weekly diet will appear here after a plan is created.';

    const dashboardNote = dietPlanAssigned
      ? 'Your assessment is complete and your diet plan is ready. View your diet plan below.'
      : assessmentDone
      ? 'Your assessment is complete. View the result below or wait for your doctor to assign one.'
      : 'Your personal dashboard is ready. Complete an assessment to receive a diet plan or ask your doctor to assign one.';

    const primaryActionHref = dietPlanAssigned
      ? '/diet-plan'
      : assessmentDone
      ? '/assessment-result'
      : '/assessment';
    const primaryActionLabel = dietPlanAssigned
      ? 'View Your Diet Plan'
      : assessmentDone
      ? 'View Assessment Result'
      : 'Take Assessment';

    if (patientStatusLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      );
    }

    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gray-50 p-6">
          <section className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-[1.7fr_0.9fr]">
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}.</h1>
                    <p className="mt-3 max-w-2xl text-gray-600">{dashboardNote}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => router.push(primaryActionHref)}
                      className="rounded-full bg-green-600 px-6 py-3 text-white font-semibold transition hover:bg-green-700"
                    >
                      {primaryActionLabel}
                    </button>
                    <button
                      onClick={() => router.push('/profile')}
                      className="rounded-full border border-green-600 bg-white px-6 py-3 text-green-700 font-semibold transition hover:bg-green-50"
                    >
                      Manage Profile
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <PatientCard title="Assessment" value={assessmentTitle} note={assessmentNote} color="green" />
                  <PatientCard title="Diet Plan" value={dietPlanTitle} note={dietPlanNote} color="blue" />
                </div>
              </div>

              <section className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Quick Actions</h2>
                    <p className="mt-2 text-gray-600">Access the most important steps in one place.</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <button
                    onClick={() => router.push(assessmentDone ? '/assessment-result' : '/assessment')}
                    className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 text-left transition hover:border-green-300 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {assessmentDone ? 'View Dosha Result' : 'Dosha Assessment'}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      {assessmentDone
                        ? 'See your saved assessment result and next steps.'
                        : 'Finish your quiz for a tailored diet plan.'}
                    </p>
                  </button>
                  <button
                    onClick={() => router.push('/diet-plan')}
                    className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 text-left transition hover:border-green-300 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-gray-900">Weekly Diet Plan</p>
                    <p className="mt-2 text-sm text-gray-600">Review your current meal recommendations.</p>
                  </button>
                  <button
                    onClick={() => router.push('/contact')}
                    className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4 text-left transition hover:border-green-300 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-gray-900">Need Help?</p>
                    <p className="mt-2 text-sm text-gray-600">Contact support or ask your doctor for guidance.</p>
                  </button>
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
                <p className="mt-2 text-gray-600">Quick overview of your current milestones.</p>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-3xl bg-green-50 p-5">
                    <p className="text-sm text-green-700">Assessment Status</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{assessmentTitle}</p>
                  </div>
                  <div className="rounded-3xl bg-blue-50 p-5">
                    <p className="text-sm text-blue-700">Diet Plan Status</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">{dietPlanTitle}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900">Navigation</h2>
                <div className="mt-5 grid gap-3">
                  <button
                    onClick={() => router.push('/assessment')}
                    className="rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 transition hover:bg-white"
                  >Assessment</button>
                  <button
                    onClick={() => router.push('/diet-plan')}
                    className="rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 transition hover:bg-white"
                  >Diet Plan</button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="rounded-3xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 transition hover:bg-white"
                  >Profile</button>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-6 space-y-6">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dr. {user.name}&apos;s Dashboard</h1>
              <p className="text-gray-500">Manage patients, plans, and follow-ups.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input type="text" placeholder="Search patients..." value={query} onChange={(e) => setQuery(e.target.value)} className="border rounded-lg px-3 py-2 shadow-sm outline-none w-52" />
              <select value={doshaFilter} onChange={(e) => setDoshaFilter(e.target.value as Patient["dosha"] | "")} className="border rounded-lg px-3 py-2 shadow-sm outline-none">
                <option value="">All Doshas</option>
                <option value="Vata">Vata</option>
                <option value="Pitta">Pitta</option>
                <option value="Kapha">Kapha</option>
                <option value="Mixed">Mixed</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Patient["status"] | "")} className="border rounded-lg px-3 py-2 shadow-sm outline-none">
                <option value="">All Status</option>
                <option value="New">New</option>
                <option value="On Plan">On Plan</option>
                <option value="Follow-up Due">Follow-up Due</option>
                <option value="Completed">Completed</option>
              </select>
              <button onClick={() => setShowAdd(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 flex items-center gap-2"><FiPlus /> Add Patient</button>
            </div>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4 rounded-3xl">
            <StatCard title="Total Patients" value={totals.totalPatients} icon={<FiUsers className="text-green-600 text-2xl" />} />
            <StatCard title="Active Plans" value={totals.activePlans} icon={<FiActivity className="text-blue-600 text-2xl" />} />
            <StatCard title="Follow-ups" value={totals.followUps} icon={<FiRefreshCw className="text-yellow-500 text-2xl" />} />
            <StatCard title="Alerts" value={totals.alerts} icon={<FiAlertTriangle className="text-red-500 text-2xl" />} />
          </section>

          <section className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Patient List</h2>
                <p className="text-gray-500 mt-1">View patient details and assign diet plans.</p>
              </div>
              <span className="text-sm text-gray-500">{filteredPatients.length} results</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 font-medium">Age / Sex</th>
                    <th className="p-3 font-medium">Dosha</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Adherence</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-800">{patient.name}</td>
                      <td className="p-3 text-center text-gray-600">{patient.age ?? '-'} / {patient.sex}</td>
                      <td className="p-3 text-center text-gray-600">{patient.dosha}</td>
                      <td className="p-3 text-center text-gray-600">{patient.status}</td>
                      <td className="p-3">
                        <div className="w-28 bg-gray-50 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${patient.adherence ?? 0}%`, background: patient.adherence ?? 0 >= 75 ? '#10b981' : patient.adherence ?? 0 >= 50 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="text-xs text-gray-400 mt-1 block">{patient.adherence ?? 0}%</span>
                      </td>
                      <td className="p-3 flex gap-2 justify-center">
                        <button onClick={() => router.push(`/patient-details?patientId=${patient.id}`)} className="px-3 py-1 text-xs border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600">View</button>
                        <button onClick={() => router.push('/diet-doc')} className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700">Create Plan</button>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-gray-400">No patients assigned yet. Add a patient to begin.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <form onSubmit={handleAddPatient} className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Add New Patient</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-900">Cancel</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} placeholder="Full Name" className="border rounded-xl px-4 py-3" required />
              <input value={newPatient.email} onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })} placeholder="Email" type="email" className="border rounded-xl px-4 py-3" required />
              <input value={newPatient.password} onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })} placeholder="Temporary Password" type="password" className="border rounded-xl px-4 py-3" required />
              <select value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })} className="border rounded-xl px-4 py-3">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
              <input value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: Number(e.target.value) })} placeholder="Age" type="number" min={1} className="border rounded-xl px-4 py-3" />
              <input value={newPatient.height} onChange={(e) => setNewPatient({ ...newPatient, height: Number(e.target.value) })} placeholder="Height (cm)" type="number" min={1} className="border rounded-xl px-4 py-3" />
              <input value={newPatient.weight} onChange={(e) => setNewPatient({ ...newPatient, weight: Number(e.target.value) })} placeholder="Weight (kg)" type="number" min={1} className="border rounded-xl px-4 py-3" />
              <select value={newPatient.dosha} onChange={(e) => setNewPatient({ ...newPatient, dosha: e.target.value })} className="border rounded-xl px-4 py-3">
                <option>Vata</option>
                <option>Pitta</option>
                <option>Kapha</option>
              </select>
            </div>
            {formError && <p className="text-sm text-red-600 mt-4">{formError}</p>}
            {message && <p className="text-sm text-green-600 mt-2">{message}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-3 rounded-xl border border-gray-300">Cancel</button>
              <button type="submit" className="px-5 py-3 rounded-xl bg-green-600 text-white">Add Patient</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function PatientCard({
  title,
  value,
  note,
  color,
}: {
  title: string;
  value: string;
  note: string;
  color: 'green' | 'blue';
}) {
  return (
    <div className={`p-6 rounded-3xl shadow-sm ${
      color === 'green' ? 'bg-green-50' : 'bg-blue-50'
    }`}>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-600 mt-2">{note}</p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-2xl shadow-lg flex items-center gap-4 bg-white">
      <div className="p-3 bg-gray-50 rounded-full">{icon}</div>
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
