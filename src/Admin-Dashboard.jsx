import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  arrayRemove,
  db,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  signOut,
  arrayUnion,
} from "./firebase";
import AdminLayout from "./components/AdminLayout";
import "./style/App.css";  // or whatever your main CSS is

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("");  // default to home
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [newClassName, setNewClassName] = useState("");
  const [assignEmail, setAssignEmail] = useState([]);
  const [assignClass, setAssignClass] = useState("");
  const [assignRole, setAssignRole] = useState("Student");
  const [userFilter, setUserFilter] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const [newClassImage, setNewClassImage] = useState("");
  const [newClassRoom, setNewClassRoom] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newGradeWeights, setNewGradeWeights] = useState({
    homework: "",
    quizzes: "",
    exams: "",
    projects: "",
});

  const navigate = useNavigate();

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        alert("Access denied. Admins only.");
        await signOut(auth);
        navigate("/");
      } else {
        fetchUsers();
        fetchClasses();
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "users"));
    setUsers(snapshot.docs.map((doc) => doc.data()));
    setLoading(false);
  };

  const fetchClasses = async () => {
    const snapshot = await getDocs(collection(db, "classes"));
    setClasses(snapshot.docs.map((doc) => doc.data()));
  };

  const updateUser = async (email, updates) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return showMessage("User not found.");

    const userRef = doc(db, "users", snapshot.docs[0].id);
    await updateDoc(userRef, updates);
    showMessage(`Updated user: ${email}`);
    fetchUsers();
  };

  const createNewClass = async () => {
    if (!newClassName.trim()) return showMessage("Class name required.");
    const ref = doc(db, "classes", newClassName);
    await setDoc(ref, {
      className: newClassName,
      roomNumber: newClassRoom,
      description: newClassDescription,
      imageUrl: newClassImage || "",
      gradeWeights: {
        homework: newGradeWeights.homework,
        quizzes: newGradeWeights.quizzes,
        exams: newGradeWeights.exams,
        projects: newGradeWeights.projects,
    },
      students: [],
      faculty: [],
      tas: [],
    });
    showMessage(`Class "${newClassName}" created.`);
    setNewClassName("");
    setNewClassRoom("");
    setNewClassDescription("");
    setNewGradeWeights({
      homework: "",
      quizzes: "",
      exams: "",
      projects: "",
    });
    fetchClasses();
  };

  const deleteClass = async (className) => {
    if (
      !window.confirm(
        `Are you sure you want to delete class "${className}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "classes", className));

      const usersSnapshot = await getDocs(collection(db, "users"));
      const updates = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        if (userData.classes?.includes(className)) {
          const userRef = doc(db, "users", userDoc.id);
          await updateDoc(userRef, { classes: arrayRemove(className) });
        }
      });

      await Promise.all(updates);

      showMessage(`Class "${className}" deleted.`);
      fetchClasses();
      fetchUsers();
    } catch (error) {
      console.error("Error deleting class: ", error);
      showMessage("Failed to delete class.");
    }
  };

  const assignUser = async () => {
    if (!assignEmail.length) return showMessage("Select at least one user.");
    if (!assignClass.trim()) return showMessage("Please select a class.");

    const results = [];

    for (let email of assignEmail) {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        results.push(`${email}: Not found`);
        continue;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      if (
        (assignRole === "Student" && userData.role !== "student") ||
        (assignRole === "Faculty" && userData.role !== "faculty") ||
        (assignRole === "TA" && userData.role !== "ta")
      ) {
        results.push(`${email}: Not a valid ${assignRole}`);
        continue;
      }

      const userRef = doc(db, "users", userDoc.id);
      const classRef = doc(db, "classes", assignClass);
      const classDoc = await getDoc(classRef);

      if (!classDoc.exists()) {
        results.push(`${email}: Class not found`);
        break;
      }

      let roleKey;
      if (assignRole === "Faculty") roleKey = "faculty";
      else if (assignRole === "TA") roleKey = "tas";
      else roleKey = "students";

      await updateDoc(classRef, { [roleKey]: arrayUnion(email) });
      await updateDoc(userRef, { classes: arrayUnion(assignClass) });

      results.push(`${email}: Assigned as ${assignRole}`);
    }

    showMessage(results.join("\n"));
    setAssignEmail([]);
    setAssignClass("");
    setSelectAll(false);
    fetchUsers();
    fetchClasses();
  };

  const removeUsersFromClass = async () => {
    if (!assignEmail.length) return showMessage("Select at least one user.");
    if (!assignClass.trim()) return showMessage("Please select a class.");

    const results = [];

    for (let email of assignEmail) {
      const q = query(collection(db, "users"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        results.push(`${email}: Not found`);
        continue;
      }

      const userDoc = snapshot.docs[0];
      const userRef = doc(db, "users", userDoc.id);

      let roleKey;
      if (assignRole === "Faculty") roleKey = "faculty";
      else if (assignRole === "TA") roleKey = "tas";
      else roleKey = "students";

      await updateDoc(doc(db, "classes", assignClass), {
        [roleKey]: arrayRemove(email),
      });

      await updateDoc(userRef, {
        classes: arrayRemove(assignClass),
      });

      results.push(`${email}: Removed from ${assignClass}`);
    }

    showMessage(results.join("\n"));
    setAssignEmail([]);
    setSelectAll(false);
    fetchUsers();
    fetchClasses();
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const filteredUsers = users
    .filter((u) => u.role === assignRole.toLowerCase())
    .filter(
      (u) =>
        u.name.toLowerCase().includes(userFilter.toLowerCase()) ||
        u.email.toLowerCase().includes(userFilter.toLowerCase())
    );

  return (
    <AdminLayout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      message={message}
      onLogout={handleLogout}
      users={users}
      updateUser={updateUser}
      capitalize={capitalize}
      classes={classes}
      newClassName={newClassName}
      setNewClassName={setNewClassName}
      createNewClass={createNewClass}
      deleteClass={deleteClass}
      assignEmail={assignEmail}
      setAssignEmail={setAssignEmail}
      assignClass={assignClass}
      setAssignClass={setAssignClass}
      assignRole={assignRole}
      setAssignRole={setAssignRole}
      userFilter={userFilter}
      setUserFilter={setUserFilter}
      selectAll={selectAll}
      setSelectAll={setSelectAll}
      filteredUsers={filteredUsers}
      assignUser={assignUser}
      removeUsersFromClass={removeUsersFromClass}
      newClassRoom={newClassRoom}
  setNewClassRoom={setNewClassRoom}
  newClassDescription={newClassDescription}
  setNewClassDescription={setNewClassDescription}
  newGradeWeights={newGradeWeights}
  setNewGradeWeights={setNewGradeWeights}
  newClassImage={newClassImage}
  setNewClassImage={setNewClassImage}
    >
      {loading && <p>Loading...</p>}
    </AdminLayout>
  );
};

export default AdminDashboard;
