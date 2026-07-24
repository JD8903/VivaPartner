import { useEffect, useMemo, useState } from "react";

import {
  getClasses,
  deleteClass,
} from "../../services/classApi";

import ClassHeader from "../../components/Classes/ClassHeader";
import ClassSearch from "../../components/Classes/ClassSearch";
import ClassTable from "../../components/Classes/ClassTable";
import Pagination from "../../components/Classes/Pagination";
import DeleteClassModal from "../../components/Classes/DeleteClassModal";

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedClass, setSelectedClass] =
    useState(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const classesPerPage = 8;

  const loadClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data.classes || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const filteredClasses = useMemo(() => {
    return classes.filter((item) =>
      `${item.name} ${item.code} ${
        item.department?.name || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [classes, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredClasses.length / classesPerPage)
  );

  const paginatedClasses =
    filteredClasses.slice(
      (currentPage - 1) * classesPerPage,
      currentPage * classesPerPage
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async () => {
    if (!selectedClass) return;

    try {
      setDeleteLoading(true);

      await deleteClass(selectedClass._id);

      setClasses((prev) =>
        prev.filter(
          (item) => item._id !== selectedClass._id
        )
      );

      setSelectedClass(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <h2>Loading Classes...</h2>;

  return (
    <>
      <ClassHeader />

      <ClassSearch
        value={search}
        onChange={setSearch}
      />

      <p style={{ margin: "20px 0" }}>
        Total Classes:
        <strong> {filteredClasses.length}</strong>
      </p>

      <ClassTable
        classes={paginatedClasses}
        onDelete={setSelectedClass}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <DeleteClassModal
        classItem={selectedClass}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setSelectedClass(null)}
      />
    </>
  );
};

export default Classes;