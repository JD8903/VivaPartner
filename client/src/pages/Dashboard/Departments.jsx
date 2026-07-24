import { useEffect, useMemo, useState } from "react";

import {
  getDepartments,
  deleteDepartment,
} from "../../services/departmentApi";

import DepartmentHeader from "../../components/Departments/DepartmentHeader";
import DepartmentSearch from "../../components/Departments/DepartmentSearch";
import DepartmentTable from "../../components/Departments/DepartmentTable";
import Pagination from "../../components/Departments/Pagination";
import DeleteDepartmentModal from "../../components/Departments/DeleteDepartmentModal";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [selectedDepartment, setSelectedDepartment] =
    useState(null);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const departmentsPerPage = 8;

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) =>
      `${department.name} ${department.code} ${department.description}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [departments, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredDepartments.length /
        departmentsPerPage
    )
  );

  const paginatedDepartments =
    filteredDepartments.slice(
      (currentPage - 1) * departmentsPerPage,
      currentPage * departmentsPerPage
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    try {
      setDeleteLoading(true);

      await deleteDepartment(
        selectedDepartment._id
      );

      setDepartments((prev) =>
        prev.filter(
          (item) =>
            item._id !== selectedDepartment._id
        )
      );

      setSelectedDepartment(null);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading)
    return <h2>Loading Departments...</h2>;

  return (
    <>
      <DepartmentHeader />

      <DepartmentSearch
        value={search}
        onChange={setSearch}
      />

      <p style={{ margin: "20px 0" }}>
        Total Departments:
        <strong>
          {" "}
          {filteredDepartments.length}
        </strong>
      </p>

      <DepartmentTable
        departments={paginatedDepartments}
        onDelete={setSelectedDepartment}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <DeleteDepartmentModal
        department={selectedDepartment}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() =>
          setSelectedDepartment(null)
        }
      />
    </>
  );
};

export default Departments;