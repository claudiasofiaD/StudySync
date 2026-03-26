import React from "react";
import { useNavigate } from "react-router-dom";

const CourseCard = ({ course, role }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const courseName = encodeURIComponent(course.name);
    if (role === "student") {
      navigate(`/Student-Courses/${courseName}`);
    } else {
      navigate(`/Faculty-Courses/${courseName}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col">
      <div className="relative h-40 rounded-md overflow-hidden mb-4 shadow-sm">
        <img
          src={course.imageUrl}
          alt={course.name}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>

      <h4 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        {course.name}
      </h4>

      {course.description && (
        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
          {course.description}
        </p>
      )}

      {course.roomNumber && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span className="font-medium">Room:</span> {course.roomNumber}
        </p>
      )}

      <button
        onClick={handleClick}
        className="mt-auto bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 text-white font-semibold py-2 rounded-md transition"
      >
        View Course
      </button>
    </div>
  );
};

export default CourseCard;
