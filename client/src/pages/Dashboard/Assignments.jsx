import { useEffect, useMemo, useState } from "react";

import {
  getAssignments,
  deleteAssignment,
} from "../../services/assignmentApi";

import "./Assignments.css";

import AssignmentHeader from "../../components/Assignments/AssignmentHeader";
import AssignmentSearch from "../../components/Assignments/AssignmentSearch";
import AssignmentTable from "../../components/Assignments/AssignmentTable";
import Pagination from "../../components/Assignments/Pagination";
import DeleteAssignmentModal from "../../components/Assignments/DeleteAssignmentModal";

const ITEMS_PER_PAGE = 10;

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [selectedAssignment, setSelectedAssignment] =
    useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const response = await getAssignments();

      setAssignments(response.assignments || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const search = searchTerm.toLowerCase();

      return (
        assignment.teacher?.name
          ?.toLowerCase()
          .includes(search) ||
        assignment.department?.name
          ?.toLowerCase()
          .includes(search) ||
        assignment.subject?.name
          ?.toLowerCase()
          .includes(search) ||
        assignment.class?.name
          ?.toLowerCase()
          .includes(search)
      );
    });
  }, [assignments, searchTerm]);

  const totalPages = Math.ceil(
    filteredAssignments.length / ITEMS_PER_PAGE
  );

  const currentAssignments = filteredAssignments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteClick = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (id) => {
    try {
      await deleteAssignment(id);

      setAssignments((prev) =>
        prev.filter((item) => item._id !== id)
      );

      setShowDeleteModal(false);
      setSelectedAssignment(null);
    } catch (error) {
      console.error(error);
      alert("Failed to delete assignment.");
    }
  };

  return (
    <div className="dashboard-page">

      <AssignmentHeader
        total={filteredAssignments.length}
      />

      <AssignmentSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {loading ? (
        <h3>Loading...</h3>
      ) : (
        <>
          <AssignmentTable
            assignments={currentAssignments}
            onDelete={handleDeleteClick}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}

      <DeleteAssignmentModal
        isOpen={showDeleteModal}
        assignment={selectedAssignment}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAssignment(null);
        }}
        onConfirm={handleConfirmDelete}
      />

    </div>
  );
};

export default Assignments;