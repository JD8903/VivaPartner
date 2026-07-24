import { useEffect, useMemo, useState } from "react";
import {
  getTeachers,
  deleteTeacher,
} from "../../services/teacherApi";

import TeacherHeader from "../../components/Teachers/TeacherHeader";
import TeacherSearch from "../../components/Teachers/TeacherSearch";
import TeacherTable from "../../components/Teachers/TeacherTable";
import Pagination from "../../components/Teachers/Pagination";
import DeleteTeacherModal from "../../components/Teachers/DeleteTeacherModal";

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 8;

  // Delete States
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ==========================
  // Load Teachers
  // ==========================
  const loadTeachers = async () => {
    try {
      setLoading(true);

      const data = await getTeachers();

      setTeachers(data.teachers || []);
    } catch (err) {
      console.error("Load Teachers Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  // ==========================
  // Search
  // ==========================
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) =>
      `${teacher.name} ${teacher.email} ${teacher.department}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [teachers, search]);

  // ==========================
  // Pagination
  // ==========================
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTeachers.length / teachersPerPage)
  );

  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * teachersPerPage,
    currentPage * teachersPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ==========================
  // Delete Teacher
  // ==========================
  const handleDelete = async () => {
    if (!selectedTeacher) return;

    try {
      setDeleteLoading(true);

      await deleteTeacher(selectedTeacher._id);

      setTeachers((prev) =>
        prev.filter(
          (teacher) =>
            teacher._id !== selectedTeacher._id
        )
      );

      setSelectedTeacher(null);
    } catch (err) {
      console.error("Delete Teacher Error:", err);
      alert("Failed to delete teacher.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ==========================
  // Loading
  // ==========================
  if (loading) {
    return <h2>Loading Teachers...</h2>;
  }

  // ==========================
  // UI
  // ==========================
  return (
    <>
      <TeacherHeader />

      <TeacherSearch
        value={search}
        onChange={setSearch}
      />

      <p style={{ marginBottom: "15px" }}>
        Total Teachers:{" "}
        <strong>{filteredTeachers.length}</strong>
      </p>

      <TeacherTable
        teachers={paginatedTeachers}
        onDelete={setSelectedTeacher}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <DeleteTeacherModal
        teacher={selectedTeacher}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setSelectedTeacher(null)}
      />
    </>
  );
};

export default Teachers;