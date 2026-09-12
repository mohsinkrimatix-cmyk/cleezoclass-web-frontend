// App.jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { io } from "socket.io-client";

import GuideProvider from "./components/Guide/GuideProvider";

import "./shared/App.css";
// import Sidebarteacher2 from "./shared/Dashboard (1).jsx";
import Interface from "./shared/parties.jsx";
import PayementDemo from "./accountant/Accountant_FeesManagement_income_payment.jsx";
import GenerateBill from "./accountant/Accountant_commerce_income_GenerateBill.jsx";
import IncomeForm5 from "./shared/IncomeformTwo.jsx";
import FinancePage from "./shared/FinancePage.jsx";
import GenerateBills from "./accountant/Accountant_FeesManagement_Bills.jsx";
import GenerateBillPrint from "./shared/print.jsx";
import UnpaidStudents from "./shared/UnpaidStudents.jsx";
import AttendanceForms from "./shared/TeacherAttendanceTimeSetting.jsx";
import SalaryForm from "./shared/LeaveManagement.jsx";
import Attendance from "./shared/PayrollManagement.jsx";
import Radiusselectingg from "./shared/radiusselcting.jsx";
import StudentManagementedit from "./shared/studentediting.jsx";
import TeacherManagement from "./shared/Teacherediting.jsx";
import Events from "./shared/EvenGenerations.jsx";
import MarketingDashboard from "./shared/marketingDashboard (1).jsx";
import SchoolAdmissionForm from "./shared/Enrollmentform.jsx";
import QuestionPaperGenerate from "./adminfolder/Admin_AcademicStaff.jsx";
import AdminQuestionPaper from "./adminfolder/AdminQuestionPaper.jsx";
import TeacherUpload from "./shared/Teacherupload.jsx";
import Leadpages from "./shared/leadpage (1).jsx";
import MeetingApp from "./shared/MeetingApp (1).jsx";
import TeacherDetails from "./shared/AssignedTeachers.jsx";
import Teacherstimetable from "./shared/Oprations_TeachersTimeable.jsx";
import LoginPage2 from "./shared/ManagementLogin.jsx";
import MainDashboard2 from "./shared/DirectorDashbard.jsx";
import ExpenseManagement from "./shared/ExpenseManagement.jsx";
import AcademicManagement from "./shared/AcademicManagement.jsx";
import TimetableGeneration from "./shared/Finaltimetable.jsx";
import TeacherSalaryForPay from "./shared/TeacherSalaryForPay.jsx";
import AdmissionsTable from "./shared/followup.jsx";
import ReportCard from "./shared/Reportcard.jsx";
import ReportCardFull from "./shared/ReportCard2.jsx";
import ReportCardpotrait from "./shared/REPORTCARD3.jsx";
import ReportDashboard from "./shared/Reports.jsx";
import StudentsAttendance from "./chief/Chirf_admin_StudentsAttendance.jsx";
import StudentsList from "./shared/StudentList.jsx";
import NewDashboard from "./chief/ChiefDashboard.jsx";
import ClassroomEvents from "./shared/classroomevents.jsx";
import CommerceDashboard from "./accountant/Accountant.jsx";
import OperationsPage from "./shared/Operation.jsx";
import MarketingPage from "./shared/Marketing.jsx";
import HRPage from "./hr/Hr.jsx";
import OperationDashboard from "./shared/OperationsDashboard.js.jsx";
import AdminDashboardold from "./adminfolder/AdminDashboard.jsx";
import SeatingArrangement from "./shared/SeatingArrangement.jsx";
import Certificates from "./hr/HR_payroll_Certificates.jsx";
import TeacherEventManagement from "./shared/TeacherEventManagement.jsx";
import ExaminationPage from "./shared/Examination.jsx";
import ChatOperations from "./adminfolder/Admin_Events And Meetings.jsx";
import Pending from "./shared/QuestionpaperGenerator.jsx";
import ScanPull from "./shared/ScanPull.jsx";
import Biometric from "./hr/HR_Biometric.jsx";
import EditEnrollments from "./hr/HR_Biometric_EditPreviousEnrollment.jsx";
import DeleteEnrollments from "./hr/HR_Biometric_DeleteEnrollment.jsx";
import AdmissionsList from "./hr/HR_biometric_new_enrollment.jsx";
import LeaveRequests from "./hr/HR_Biometric_LeaveRequests.jsx";
import AttendanceList from "./hr/HR_biometric_Irregular.jsx";
import DeletedUsers from "./hr/HR_biometric_StudentExit.jsx";
import RecommendationForm from "./shared/Recommendation.jsx";
import BiometricTeacher from "./hr/HR_BiometricTeacher.jsx";
import TeacherAttendanceList from "./hr/HR_Tracking_TeacherIrregullar.jsx";
import TeacherLeaveRequests from "./hr/HR_Tracking_TeacherLeaveRequest.jsx";
import TeacherLatecomers from "./hr/HR_Ttracking_eacherLateComers.jsx";
import EditPayroll from "./hr/HR_editPayroll.jsx";
import BreakUpForm from "./hr/HR_payroll_BaseEntryForm.jsx";
import TeacherManagementEdit from "./hr/HR-Biometric_TeacherEditPreivious.jsx";
import TeacherManagementDelete from "./hr/HR_Biometric_DeleteTeacherDetails.jsx";
import DeletedTeachers from "./hr/HR_biometric_ExitTeachers.jsx";
import Recruiters from "./shared/Recruiters.jsx";
import EventAndMeetings from "./hr/HR_EventsMettings.jsx";
import NewMeetingApp from "./shared/NewMeetings.jsx";

import HighScorers from "../PASSESSTUDENTS.jsx";
import EventsMeetingsChief from "./chief/Chief_Hr_EventsMeeting.jsx";
import ExammanagementChief from "./chief/Chief_operations_ExamManagemement.jsx";
import IncomeChief from "./chief/Chief_commerce_Income.jsx";
import HrDashboard from "./hr/HrDashboard.jsx";
import AdmissionTeacherChief from "./chief/Chief_operations_AdmissionTeacher.jsx";
import AdmissionStudentChief from "./chief/Chief_operations_AdmissionStudent.jsx";
import ChiefDashboardWrapper from "./chief/Chief_operations_AdmissionTab.jsx";
import TimetableAdmin from "./shared/Admin_Timetable.jsx";
import ExtraClasses from "./shared/ExtraClasses.jsx";
import SubstituteAssignment from "./shared/AssignSubstititute.jsx";
import AccademicAdminDashboard from "./adminfolder/AccademicAdmin.jsx";
import AdmissionStudentAdmin from "./adminfolder/Admin_AcademicStudent.jsx";
import Store from "./shared/Admin_Store.jsx";
import AccountantDashboard from "./accountant/AccountantDashboard.jsx";
import AccountantIncome from "./accountant/Accountant_FeesManagement_Income.jsx";
import Discount from "./accountant/Accounatant_FeesManagement_Discounts.jsx";
import StudentUpload from "./shared/studentUpload.jsx";
import ExpensesDashboardInline from "./accountant/Accountant_ExpenseManagement_Expense.jsx";
import AccountantParties from "./accountant/Accountant_Parties.jsx";
import FeeSummary from "./accountant/Accountant_ExpenseManagement_expense_Expense.jsx";
import ExpenseForm from "./accountant/ExpensesAccountant.jsx";
import AddLead from "./shared/AddLead.jsx";
import ExamDashboard from "./shared/TEST.jsx";
import Marketing from "./hr/HrDashboardold.jsx";
import DiscountAccountant from "./accountant/Accounatant_FeesManagement_Discounts.jsx";
import StudentList from "./shared/StudentsList.jsx";
import QuestionPaperGenerator from "./shared/QuestionPaperGeneration.jsx";


import FrontDesk_TestAndCouncelling from "./frontdeskdahboard/FrontDesk_TestAndCouncelling.tsx";
import Frontdesk_Communication from "./frontdeskdahboard/Frontdesk_Communication.tsx";
import AdmissionCRM from "./frontdeskdahboard/FrontDesk_Admission.tsx";
import FrontDeskAdmissionQR from "./frontdeskdahboard/FrontDesk_AdmissionQR.tsx";
import LeadProfilePage from "./frontdeskdahboard/FrontDesk_LeadsProfilePage.tsx";
import FrontDeskDashboard from "./frontdeskdahboard/FrontDeskDashboard.tsx";
import LeadsTable from "./frontdeskdahboard/FrontDesk_Track.tsx";
import AdmissionCRMTesting from "./frontdeskdahboard/FrontDesk_Enrollment.tsx";
import FrontDeskDashboardFinal from "./frontdeskdahboard/FrontDesk.tsx";
import FrontDeskCampaigning from "./frontdeskdahboard/FrontDeskCampaigning.tsx";
import FrontDeskWhatsAppLast3Days from "./frontdeskdahboard/FrontDeskWhatsAppLast3Days.tsx";
import FrontDeskReport from "./frontdeskdahboard/frontDeskReport.tsx";
import FrontDeskDashboardImage from "./frontdeskdahboard/FrontDeskDashboardImage.tsx";
import FrontDesk_Tickets from "./frontdeskdahboard/FrontDesk_Tickets.tsx";



import SchoolPhotos from "./shared/SchoolPhotos.jsx";
import ParentAdmissionLogin from "./shared/ParentAdmissionLogin.jsx";
import ParentAdmissionPage from "./shared/ParentAdmissionDashboard.jsx";
import ParentHomepage from "./shared/ParentHomepage.jsx";
import TeacherDashboard from "./shared/TeacherDashboard.jsx";
import CentralizationDashboard from "./shared/CentralizationDashboard.tsx";
import CentalizationLoginForm from "./shared/CentralizationLogin.jsx";
import ErrorPopup from "./shared/ErrorPopup.jsx";
import Scanner from "./shared/scanner.jsx";
import AdminTopics from "./adminfolder/AdminTopic.jsx";
import Header from "./shared/header.jsx";
import UploadLogo from "./shared/logo.jsx";
import AddTransport from "./shared/Transportation.tsx";
import AddSchoolBranchModal from "./shared/AddSchoolBranchModal.tsx";
import BusDetailsModal from "./shared/BusDetails.tsx";
import FeesForm from "./shared/FeesInsertion.jsx";
import AccountantFeesIncomeDetails from "./shared/Sample.jsx";
import Ledger from "./shared/Ledger.jsx";
import FeesSummary from "./shared/FeeSummary.jsx";
import StudentData from "./shared/StudentData.jsx";
import Email from "./shared/EMAIL.jsx";
import AdmissionReportPopup from "./shared/AdmissionReportPopup.tsx";
import MouOrderForm from "./shared/Form.tsx";
import SignMou from "./shared/SigninPage.tsx";
import ExcelUploadLead from "./shared/AutoLead.jsx";
import ReportCardPage from "./pages/ReportCardPage.jsx";
import WhatsAppConnect from "./shared/WhatsApp.jsx";
import WhatsAppSender from "./shared/Testingwhat.jsx";
import TaskOfTheDay from "./shared/TaskOfTheDay.tsx";

import AccountantDashboardNew from "./accountant/AccountantDashboardnew.jsx";
import AccountantFeesPageNew from "./accountant/AccountantFeesPageNew.jsx";
import AccountantReportsPage from "./accountant/AccountantReportsPage.tsx";
import AccountantExpensesPageNew from "./accountant/AccountantExpensesPageNew.jsx";
import AdmissionDashboardNew from "./adminfolder/AdminDashboardNew.tsx";
import AdiminAcademicsNew from "./adminfolder/AdiminAcademicsNew.jsx";
import AdminEventsAndMeetings from "./adminfolder/AdminEventsAndMeetings.jsx";
import AdminStoreNew from "./adminfolder/AdminStoreNew.jsx";
import AdminReportsPage from "./adminfolder/AdminReportsPage.tsx";
import AdmissionTimetableNew from "./shared/AdmissionTimetableNew.jsx";
import AdminGenerations from "./adminfolder/AdminGenerations.jsx";
import Posters from "./shared/posters.jsx";
import AdminDashboard from "./adminfolder/AdminDashboard.jsx";
import NumberOfStudents from "./shared/NumberOfStudents.jsx";
import SchoolEvents from "./shared/SchoolEvent.jsx";

const ROLE_HOME_ROUTE = {
  hr: "/HRDashboard",
  director: "/form",
  accountant: "/AccountantDashboard",
  teacher: "/TeacherDashboard",
  student: "/ParentHomepage",
  management: "/homepage3",
  superadmin: "/ChiefDashboard",
  marketing: "/FrontDeskDashboard",
  admin: "/AdminDashboard",
  campaigning: "/CentralizationDashboard",
};

const SUPERADMIN_CLICK_GATED_ROUTES = new Set([
  "/AdminDashboard",
  "/FrontDeskDashboard",
  "/HRDashboard",
]);

const ProtectedRoute = ({ allowedRoles, children }) => {
  const role = sessionStorage.getItem("userRole");
  const location = useLocation();

  if (!role) {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    return (
      <Navigate
        to="/"
        replace
        state={{
          authError: "Please login again to access this page.",
          from: location.pathname,
        }}
      />
    );
  }

  if (role === "superadmin") {
    if (SUPERADMIN_CLICK_GATED_ROUTES.has(location.pathname)) {
      const allowedRoute = sessionStorage.getItem("chiefAllowedRoute");
      const allowedAt = Number(sessionStorage.getItem("chiefAllowedAt") || 0);
      const isFresh = Date.now() - allowedAt <= 15000;
      const isAllowed = allowedRoute === location.pathname && isFresh;

      if (!isAllowed) {
        return <Navigate to="/ChiefDashboard" replace />;
      }
    }
    return children;
  }

  if (!allowedRoles.includes(role)) {
    localStorage.removeItem("username");
    localStorage.removeItem("schoolCode");
    localStorage.removeItem("userRole");
    localStorage.removeItem("name");
    sessionStorage.clear();
    return (
      <Navigate
        to="/"
        replace
        state={{
          authError: `Please login again to access ${location.pathname.replace("/", "")}.`,
          from: location.pathname,
        }}
      />
    );
  }

  return children;
};

const NotificationBridge = () => {
  const schoolCode = String(localStorage.getItem("schoolCode") || "").trim();
  const username = String(localStorage.getItem("username") || "").trim();

  useEffect(() => {
    if (!schoolCode) return;

    const socket = io("https://cleezoclass.com:4000", {
      transports: ["websocket"],
      withCredentials: true,
    });

    const handleNotification = (payload) => {
      if (String(payload?.schoolCode || "").trim() !== schoolCode) return;

      const title = String(payload?.title || "Notification").trim();
      const body = String(payload?.body || "").trim();
      const message = body ? `${title} - ${body}` : title;

      toast(message, { duration: 5000 });

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(title, { body: body || undefined });
        } catch (error) {
          console.warn("Browser notification failed:", error);
        }
      }
    };

    socket.on("connect", () => {
      socket.emit("join-school", { schoolCode, username });
    });

    socket.on("school-notification", handleNotification);

    return () => {
      socket.off("school-notification", handleNotification);
      socket.disconnect();
    };
  }, [schoolCode, username]);

  return null;
};

function App() {
  return (
        <GuideProvider>
    
    <BrowserRouter basename="/CRM">
      <div className="App">
        <NotificationBridge />
        <Toaster position="top-right" />
        <Routes>

          

          <Route path="/" element={<LoginPage2 />} />
                   <Route path="/LeadProfilePage" element={<LeadProfilePage />} />

                   <Route path="/AccountantDashboard1" element={<ProtectedRoute allowedRoles={["accountant"]}><Interface /></ProtectedRoute>} />
                                      <Route path="/AccountantDashboard" element={<ProtectedRoute allowedRoles={["accountant"]}><AccountantDashboardNew /></ProtectedRoute>} />
        <Route path="/FrontDeskDashboard" element={<ProtectedRoute allowedRoles={["marketing"]}><FrontDeskDashboard /></ProtectedRoute>} />
        <Route path="/SchoolPhotos" element={<ProtectedRoute allowedRoles={["marketing"]}><SchoolPhotos /></ProtectedRoute>} />
                                      <Route path="/ExcelUploadLead" element={<ExcelUploadLead />} />
                   <Route path="/FrontDeskDashboardFinal" element={<FrontDeskDashboardFinal />} />
<Route path="/FrontDeskCampaigning" element ={<FrontDeskCampaigning/>}/>
<Route path="/FrontDeskWhatsAppLast3Days" element={<ProtectedRoute allowedRoles={["marketing"]}><FrontDeskWhatsAppLast3Days /></ProtectedRoute>} />
<Route path="/FrontDeskReport" element={<ProtectedRoute allowedRoles={["marketing"]}><FrontDeskReport /></ProtectedRoute>} />
<Route path="/FrontDeskDashboardImage" element={<ProtectedRoute allowedRoles={["marketing"]}><FrontDeskDashboardImage /></ProtectedRoute>} />
                   <Route path="/ExpenseForm" element={<ExpenseForm />} />
                   <Route path="/AddLead" element={<AddLead />} />
                   <Route path="/ExamDashboard" element={<ExamDashboard />} />
                   <Route path="/PaidAmountdemo4" element={<Marketing />} />
                   <Route path="/AdminTopics" element={<AdminTopics />} />
                   <Route path="/LeadsTable" element={<LeadsTable />} />
                   <Route path="/MouOrderForm" element={<MouOrderForm />} />
                   <Route path="/sign/:id" element={<SignMou />} />
                   <Route path="/AccountantFees" element={<AccountantFeesPageNew />} />
                   <Route path="/AccountantExpenses" element={<ProtectedRoute allowedRoles={["accountant"]}><AccountantExpensesPageNew /></ProtectedRoute>} />
                   <Route path="/AccountantReportsPage" element={<ProtectedRoute allowedRoles={["accountant"]}><AccountantReportsPage /></ProtectedRoute>} />

                   <Route path="/AdminDashboardold" element={<AdminDashboard/>} />
                   <Route path="/AdminDashboard" element={<AdmissionDashboardNew/>} />
                   <Route path="/AdiminAcademicsNew" element={<AdiminAcademicsNew/>} />
                   <Route path="/AdminEventsAndMeetings" element={<AdminEventsAndMeetings/>} />
                   <Route path="/AdminStoreNew" element={<AdminStoreNew/>} />
                   <Route path="/AdminReportsPage" element={<AdminReportsPage/>} />
                   <Route path="/AdmissionTimetableNew" element={<AdmissionTimetableNew/>} />

                   <Route path="/Posters" element={<Posters/>} />

                   <Route path="/PaidAmount" element={<PayementDemo />} />
                   <Route path="/PaidAmountdemo" element={<GenerateBill />} />
                   <Route path="/IncomeForm" element={<IncomeForm5 />} />
                   <Route path="/FinancePage" element={<FinancePage />} />
                                      <Route path="/GenerateBills" element={<GenerateBills />} />
                                        <Route path="/UnpaidStudents" element={<UnpaidStudents/>} />
                                                                        <Route path="/UnpaidStudents" element={<UnpaidStudents/>} />
                                                               <Route path="/RecruitmentDashboard" element={<Marketing/>} />
                                                               <Route path="/TeacherAttendanceForms" element={<AttendanceForms/>} />
                                                               <Route path="/AccountantIncome" element={<AccountantIncome/>} />
                                                               <Route path="/Discount" element={<Discount/>} />
                                                             <Route path="/WhatsAppConnect" element={<WhatsAppConnect/>} />
                                                           <Route path="/WhatsAppSender" element={<WhatsAppSender/>} />


 <Route path="/FeesSummary" element={<FeesSummary/>} />
 <Route path="/StudentData" element={<StudentData/>} />
 <Route path="/Email" element={<Email/>} />
 <Route path="/AdmissionReportPopup" element={<AdmissionReportPopup/>} />

 <Route path="/salary" element={<SalaryForm/>} />
 <Route path="/Pending" element={<Pending/>} />
          <Route path="/ScanPull" element={<ScanPull/>} />
          <Route path="/scanner" element={<Scanner/>} />
 <Route path="/Biometric" element={<Biometric/>} />
 <Route path="/TimetableAdmin" element={<TimetableAdmin/>} />
 <Route path="/Store" element={<Store/>} />
 <Route path="/StudentUpload" element={<StudentUpload/>} />
 <Route path="/ExpensesDashboardInline" element={<ExpensesDashboardInline/>} />
 <Route path="/FeeSummary" element={<FeeSummary/>} />
 <Route path="/DiscountAccountant" element={<DiscountAccountant/>} />
 <Route path="/StudentList" element={<StudentList/>} />
 <Route path="/AccountantFeesIncomeDetails" element={<AccountantFeesIncomeDetails/>} />
 <Route path="/Ledger" element={<Ledger/>} />
 <Route path="/ReportCardPage" element={<ReportCardPage/>} />

 <Route path="/payroll" element={<Attendance/>} />
  <Route path="/Radiusselecting" element={<Radiusselectingg/>} />
  <Route path="/StudentManagement" element={<StudentManagementedit/>} />
    <Route path="/TeacherManagement" element={<TeacherManagement/>} />
    <Route path="/marketing" element={<MarketingDashboard/>} />
    <Route path="/enrollment" element={<SchoolAdmissionForm/>} />
    <Route path="/Test" element={<QuestionPaperGenerate/>} />
    <Route path="/TeacherUpload" element={<TeacherUpload/>} />
    <Route path="/Leadpages" element={<Leadpages/>} />
        <Route path="/operations/meetings" element={<MeetingApp/>} />
        <Route path="/TeacherDetails" element={<TeacherDetails/>} />
        <Route path="/operations/timetable" element={<Teacherstimetable/>} />
        <Route path="/LoginPage2" element={<LoginPage2/>} />
        <Route path="/homepage3" element={<ProtectedRoute allowedRoles={["management"]}><OperationDashboard/></ProtectedRoute>} />
        <Route path="/meetings/new-meetings" element={<NewMeetingApp/>} />

        <Route path="/SubstituteAssignment" element={<SubstituteAssignment/>} />
        <Route path="/AccademicAdminDashboard" element={<AccademicAdminDashboard/>} />
        <Route path="/AccountantParties" element={<AccountantParties/>} />
        <Route path="/AdminGenerations" element={<AdminGenerations/>} />

        <Route path="/form" element={<ProtectedRoute allowedRoles={["director"]}><MainDashboard2/></ProtectedRoute>} />
        <Route path="/ExpenseManagement" element={<ExpenseManagement/>} />
        <Route path="/ExtraClasses" element={<ExtraClasses/>} />
        <Route path="/AdmissionStudentAdmin" element={<AdmissionStudentAdmin/>} />

        <Route path="/accdemic" element={<AcademicManagement/>} />
        <Route path="/ReportCard" element={<ReportCard/>} />

        <Route path="/TimetableGeneration" element={<TimetableGeneration/>} />
        <Route path="/Events" element={<Events/>} />
        <Route path="/TeacherSalaryTable" element={<TeacherSalaryForPay/>} />
                <Route path="/ErrorPopup" element={<ErrorPopup/>} />

        <Route path="/follow-up" element={<AdmissionsTable/>} />
        <Route path="/ReportCardFull" element={<ReportCardFull/>} />
        <Route path="/ReportCardpotrait" element={<ReportCardpotrait/>} />
        <Route path="/operations/academics" element={<ReportDashboard/>} />
        <Route path="/students-attendance" element={<StudentsAttendance/>} />
        <Route path="/students-list" element={<StudentsList/>} />
        <Route path="/ChiefDashboard" element={<ProtectedRoute allowedRoles={["superadmin"]}><NewDashboard/></ProtectedRoute>} />
        <Route path="/operations/exam" element={<ClassroomEvents/>} />
        <Route path="/CommerceDashboard" element={<CommerceDashboard/>} />
        <Route path="/OperationsPage" element={<OperationsPage/>} />
        <Route path="/MarketingPage" element={<MarketingPage/>} />
        <Route path="/HrPages" element={<HRPage/>} />
        <Route path="/AdminDashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdmissionDashboardNew/></ProtectedRoute>} />
        <Route path="/AdminQuestionPaper" element={<ProtectedRoute allowedRoles={["admin"]}><AdminQuestionPaper/></ProtectedRoute>} />
        <Route path="/AdminReportsPage" element={<ProtectedRoute allowedRoles={["admin"]}><AdminReportsPage/></ProtectedRoute>} />
                <Route path="/EventsMeetingDashboard" element={<EventsMeetingsChief/>} />
                                <Route path="/ChiefDashboardWrapper" element={<ChiefDashboardWrapper/>} />
                <Route path="/QuestionPaperGenerator" element={<QuestionPaperGenerator/>} />
        <Route path="/FrontDesk_TestAndCouncelling" element={<FrontDesk_TestAndCouncelling/>} />
        <Route path="/Frontdesk_Communication" element={<Frontdesk_Communication/>} />
        <Route path="/FrontDesk_Tickets" element={<FrontDesk_Tickets/>} />
        <Route path="/TaskOfTheDay" element={<TaskOfTheDay/>} />
        <Route path="/FrontDesk_Enrollment" element={<AdmissionCRMTesting/>} />
        <Route path="/NumberOfStudents" element={<NumberOfStudents/>} />

                <Route path="/ExammanagementChief" element={<ExammanagementChief/>} />
  <Route path="/AdmissionTeacherChief" element={<AdmissionTeacherChief/>} />
                <Route path="/AdmissionStudentChief" element={<AdmissionStudentChief/>} />
 <Route path="/SeatingArrangement" element={<SeatingArrangement/>} />
  <Route path="/RecommendationForm" element={<RecommendationForm/>} />
  <Route path="/BiometricTeacher" element={<BiometricTeacher/>} />
  <Route path="/tracking/list-of-late-comers" element={<TeacherLatecomers/>} />
  <Route path="/ParentHomepage" element={<ProtectedRoute allowedRoles={["student"]}><ParentHomepage /></ProtectedRoute>} />
  <Route path="/ParentAdmissionPage" element={<ParentAdmissionPage/>} />

        <Route path="/payroll/issue-certificates" element={<Certificates/>} />
                <Route path="payroll/breakup-entry" element={<BreakUpForm/>} />
                <Route path="/ParentAdmissionLogin" element={<ParentAdmissionLogin/>} />

                <Route path="/tracking/list-of-irregulars" element={<TeacherAttendanceList/>} />
                <Route path="/tracking/list-of-leave-requests" element={<TeacherLeaveRequests/>} />

        <Route path="/TeacherEventManagement" element={<TeacherEventManagement/>} />
                <Route path="/ExaminationPage" element={<ExaminationPage/>} />
                <Route path="/ChatOperations" element={<ChatOperations/>} />
  <Route path="/enrollments/edit-previous-enrollment" element={<EditEnrollments/>} />
                <Route path="/enrollments/delete-enrollment" element={<DeleteEnrollments/>} />
                  <Route path="/enrollments/new-enrollment" element={<AdmissionsList/>} />
                  <Route path="/attendance/list-of-leave-requests" element={<LeaveRequests/>} />
                  <Route path="/attendance/list-of-irregulars" element={<AttendanceList/>} />
                  <Route path="/enrollments/exits" element={<DeletedUsers/>} />
        <Route path="payroll/edit-payroll-" element={<EditPayroll/>} />
        <Route path="/teacher/edit-previous-enrollment" element={<TeacherManagementEdit/>} />
        <Route path="/teacher/delete-enrollment" element={<TeacherManagementDelete/>} />
        <Route path="/teacher/exits" element={<DeletedTeachers/>} />
        <Route path="/teacher/new-enrollment" element={<Recruiters/>} />
        <Route path="/EventAndMeetings" element={<EventAndMeetings/>} />
        <Route path="/passed" element={<HighScorers/>} />
                <Route path="/TeacherDashboard" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherDashboard/></ProtectedRoute>} />

        <Route path="/IncomeChief" element={<IncomeChief/>} />
        <Route path="/HRDashboard" element={<ProtectedRoute allowedRoles={["hr"]}><HrDashboard/></ProtectedRoute>} />
        <Route path="/AdmissionCRM" element={<AdmissionCRM/>} />
        <Route path="/AdmissionQR" element={<FrontDeskAdmissionQR/>} />
        <Route path="/CentralizationDashboard" element={<ProtectedRoute allowedRoles={["campaigning"]}><CentralizationDashboard/></ProtectedRoute>} />
        <Route path="/CentalizationLoginForm" element={<CentalizationLoginForm/>} />
        <Route path="/Header" element={<Header/>} />
        <Route path="/UploadLogo" element={<UploadLogo/>} />
        <Route path="/AddTransport" element={<AddTransport/>} />
        <Route path="/AddSchoolBranchModal" element={<AddSchoolBranchModal/>} />
        <Route path="/BusDetailsModal" element={<BusDetailsModal/>} />
        <Route path="/FeesForm" element={<FeesForm/>} />
        <Route path="/AccountantDashboard1" element={<AccountantDashboard/>} />
<Route path="/SchoolEvents" element={<SchoolEvents/>} />
        </Routes>
      </div>
    </BrowserRouter></GuideProvider>
  );
}

export default App;
