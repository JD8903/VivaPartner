import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Landing
import LandingPage from "../pages/Landing/Landing";

// Authentication
import LoginPage from "../pages/Auth/Login";
import ForgotPassword from "../pages/Auth/ForgotPassword";
import VerifyOTP from "../pages/Auth/VerifyOTP";
import ResetPassword from "../pages/Auth/ResetPassword";

// Dashboard Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Teachers from "../pages/Dashboard/Teachers";
import AddTeacher from "../pages/Dashboard/Teachers/AddTeacher";
import EditTeacher from "../pages/Dashboard/Teachers/EditTeacher";
import ViewTeacher from "../pages/Dashboard/Teachers/ViewTeacher";
import Departments from "../pages/Dashboard/Departments";
import AddDepartment from "../pages/Dashboard/Departments/AddDepartment";
import EditDepartment from "../pages/Dashboard/Departments/EditDepartment";
import ViewDepartment from "../pages/Dashboard/Departments/ViewDepartment";
import Subjects from "../pages/Dashboard/Subjects";
import AddSubject from "../pages/Dashboard/Subjects/AddSubject";
import EditSubject from "../pages/Dashboard/Subjects/EditSubject";
import ViewSubject from "../pages/Dashboard/Subjects/ViewSubject";
import Classes from "../pages/Dashboard/Classes";
import AddClass from "../pages/Dashboard/Classes/AddClass";
import EditClass from "../pages/Dashboard/Classes/EditClass";
import ViewClass from "../pages/Dashboard/Classes/ViewClass";
import Assignments from "../pages/Dashboard/Assignments";
import AddAssignment from "../pages/Dashboard/Assignments/AddAssignment";
import EditAssignment from "../pages/Dashboard/Assignments/EditAssignment";
import ViewAssignment from "../pages/Dashboard/Assignments/ViewAssignment";
import Reports from "../pages/Dashboard/Reports";

import TeacherHome from "../pages/Dashboard/TeacherHome";
import AssignedClasses from "../pages/Dashboard/AssignedClasses";
import VivaSetup from "../pages/Dashboard/VivaSetup";
import StudentUpload from "../pages/Dashboard/StudentUpload";
import StudyMaterial from "../pages/Dashboard/StudyMaterial";
import StartViva from "../pages/Dashboard/StartViva";
import StudentPairing from "../pages/Dashboard/StudentPairing";
import QuestionGeneration from "../pages/Dashboard/QuestionGeneration/QuestionGeneration"
import VoiceViva from "../pages/Dashboard/VoiceViva";

// Layout
import DashboardLayout from "../layouts/DashboardLayout";

// Protected Route
import ProtectedRoute from "../components/Auth/ProtectedRoute/ProtectedRoute";

const NotFound = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontSize: "2rem",
      fontWeight: "600",
    }}
  >
    404 - Page Not Found
  </div>
);

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= Landing ================= */}
        <Route path="/" element={<LandingPage />} />

        {/* ================= Authentication ================= */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ================= Admin Dashboard ================= */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Teacher Management */}
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/add" element={<AddTeacher />} />
          <Route path="teachers/edit/:id" element={<EditTeacher />} />
          <Route path="teachers/view/:id" element={<ViewTeacher />}/>

          {/* Department Management */}
          <Route path="departments" element={<Departments />} />
          <Route path="departments/add"element={<AddDepartment />}/>
          <Route path="departments/edit/:id"element={<EditDepartment />}/>
          <Route path="departments/view/:id"element={<ViewDepartment />}/>

          {/* Subject Management */}
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/add" element={<AddSubject />} />
          <Route path="subjects/edit/:id" element={<EditSubject />} />
          <Route path="subjects/view/:id" element={<ViewSubject />} />

          {/* Classes Management */}
          <Route path="classes" element={<Classes />} />
          <Route path="classes/add" element={<AddClass />} />
          <Route path="classes/edit/:id" element={<EditClass />} />
          <Route path="classes/view/:id" element={<ViewClass />} />

          {/* Assignment Management */}
          <Route path="assignments/add" element={<AddAssignment />}/>
          <Route path="assignments/edit/:id" element={<EditAssignment />}/>
          <Route
  path="assignments/view/:id"
  element={<ViewAssignment />}
/>
          
          {/* Other Modules */}
          
          
          <Route path="assignments" element={<Assignments />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* ================= Teacher Dashboard ================= */}
          <Route
  path="/teacher"
  element={
    <ProtectedRoute allowedRoles={["teacher"]}>
      <DashboardLayout />
    </ProtectedRoute>
  }
>
  <Route index element={<TeacherHome />} />
  <Route path="dashboard" element={<TeacherHome />} />

  <Route
    path="assigned-classes"
    element={<AssignedClasses />}
  />

  <Route
    path="start-viva"
    element={<StartViva />}
  />

  <Route
    path="viva-setup"
    element={<VivaSetup />}
  />

  <Route
    path="upload-students"
    element={<StudentUpload />}
  />

  <Route
    path="study-material"
    element={<StudyMaterial />}
  />

  <Route
  path="student-pairing"
  element={<StudentPairing />}
/>

<Route
  path="/teacher/question-generation"
  element={<QuestionGeneration />}
/>

<Route
  path="/teacher/voice-viva"
  element={<VoiceViva />}
/>

</Route>


        {/* Redirect old dashboard */}
        <Route
          path="/dashboard"
          element={<Navigate to="/login" replace />}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;