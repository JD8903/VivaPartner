import { useEffect, useMemo, useState } from "react";

import {
  getSubjects,
  deleteSubject,
} from "../../services/subjectApi";

import SubjectHeader from "../../components/Subjects/SubjectHeader";
import SubjectSearch from "../../components/Subjects/SubjectSearch";
import SubjectTable from "../../components/Subjects/SubjectTable";
import Pagination from "../../components/Subjects/Pagination";
import DeleteSubjectModal from "../../components/Subjects/DeleteSubjectModal";

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSubject, setSelectedSubject] =
    useState(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const subjectsPerPage = 8;

  const loadSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) =>
      `${subject.name} ${subject.code} ${
        subject.department?.name || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [subjects, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubjects.length / subjectsPerPage)
  );

  const paginatedSubjects =
    filteredSubjects.slice(
      (currentPage - 1) * subjectsPerPage,
      currentPage * subjectsPerPage
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async () => {
    if (!selectedSubject) return;

    try {
      setDeleteLoading(true);

      await deleteSubject(selectedSubject._id);

      setSubjects((prev) =>
        prev.filter(
          (item) => item._id !== selectedSubject._id
        )
      );

      setSelectedSubject(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading)
    return <h2>Loading Subjects...</h2>;

  return (
    <>
      <SubjectHeader />

      <SubjectSearch
        value={search}
        onChange={setSearch}
      />

      <p style={{ margin: "20px 0" }}>
        Total Subjects:
        <strong> {filteredSubjects.length}</strong>
      </p>

      <SubjectTable
        subjects={paginatedSubjects}
        onDelete={setSelectedSubject}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <DeleteSubjectModal
        subject={selectedSubject}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setSelectedSubject(null)}
      />
    </>
  );
};

export default Subjects;