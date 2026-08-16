import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { PublicLayout } from './components/PublicLayout';
import { DashboardPage } from './pages/DashboardPage';
import { NewsEditorPage } from './pages/NewsEditorPage';
import { NewsListPage } from './pages/NewsListPage';
import { HomePage } from './pages/public/HomePage';
import { PublicNewsDetailPage } from './pages/public/PublicNewsDetailPage';
import { PublicNewsPage } from './pages/public/PublicNewsPage';
import { SchoolsPage } from './pages/public/SchoolsPage';
import { SchoolDetailPage } from './pages/public/SchoolDetailPage';
import { DocumentsPage } from './pages/public/DocumentsPage';
import { DocumentDetailPage } from './pages/public/DocumentDetailPage';
import { DocumentCategoryPage } from './pages/public/DocumentCategoryPage';
import { ContactsPage } from './pages/public/ContactsPage';
import { CompetitionsPage } from './pages/public/CompetitionsPage';
import { CabinetPage } from './pages/CabinetPage';
import { AdminCompetitionsPage } from './pages/AdminCompetitionsPage';
import { AdminSchoolsPage } from './pages/AdminSchoolsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminCoursesPage } from './pages/AdminCoursesPage';
import { CoursesPage } from './pages/public/CoursesPage';
import { AdminContactsPage } from './pages/AdminContactsPage';
import { AdminDocumentsPage } from './pages/AdminDocumentsPage';
import './styles/main.scss';
import './styles/public.scss';
import './styles/official-theme.scss';
export default function App() {
    return <BrowserRouter><Routes>
    <Route path="/" element={<PublicLayout />}>
      <Route index element={<HomePage />}/>
      <Route path="novosti" element={<PublicNewsPage />}/>
      <Route path="novosti/:id" element={<PublicNewsDetailPage />}/>
      <Route path="pravoslavnye-shkoly" element={<SchoolsPage />}/>
      <Route path="pravoslavnye-shkoly/:id" element={<SchoolDetailPage />}/>
      <Route path="konkursy" element={<CompetitionsPage />}/>
      <Route path="kursy" element={<CoursesPage />}/>
      <Route path="dokumenty" element={<DocumentsPage />}/>
      <Route path="dokumenty/razdel/:category" element={<DocumentCategoryPage />}/>
      <Route path="dokumenty/:id" element={<DocumentDetailPage />}/>
      <Route path="kontakty" element={<ContactsPage />}/>
      <Route path="cabinet" element={<CabinetPage />}/>
      <Route path="control-center" element={<AdminLayout />}>
        <Route index element={<DashboardPage />}/>
        <Route path="news" element={<NewsListPage />}/>
        <Route path="news/new" element={<NewsEditorPage />}/>
        <Route path="news/:id" element={<NewsEditorPage />}/>
        <Route path="documents" element={<AdminDocumentsPage />}/>
        <Route path="schools" element={<AdminSchoolsPage />}/>
        <Route path="competitions" element={<AdminCompetitionsPage />}/>
        <Route path="courses" element={<AdminCoursesPage />}/>
        <Route path="users" element={<AdminUsersPage />}/>
        <Route path="contacts" element={<AdminContactsPage />}/>
      </Route>
    </Route>
    <Route path="/admin/*" element={<Navigate to="/" replace/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></BrowserRouter>;
}
