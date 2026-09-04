import { useEffect, useRef, useState } from "react";
import { createStudent, registerFaceSamples } from "../services/api";

function RegisterStudent() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    student_code: "",
    full_name: "",
    email: "",
    mobile_number: "",
    course: "",
    department: "",
    year: "",
    semester: "",
    section: "",
    enrollment_date: "",
    status: "active",
  });

  const [studentId, setStudentId] = useState(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [samples, setSamples] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [registeringFace, setRegisteringFace] = useState(false);

  const [faceRegistrationFailed, setFaceRegistrationFailed] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  };

  const startCamera = async () => {
    try {
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
    } catch (err) {
      console.error("Camera error:", err);

      setCameraError(
        "Unable to access camera. Please allow camera permission and try again.",
      );

      setCameraReady(false);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleStudentSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");
      setSuccess("");

      const payload = {
        ...formData,
        semester: Number(formData.semester),
        enrollment_date: formData.enrollment_date || null,
        email: formData.email || null,
        mobile_number: formData.mobile_number || null,
        department: formData.department || null,
        section: formData.section || null,
      };

      const response = await createStudent(payload);

      const newStudent = response.data.student;

      setStudentId(newStudent.id);

      setSuccess("Student details saved successfully.");

      setStep(2);

      await startCamera();
    } catch (err) {
      console.error("Student registration error:", err);

      const detail = err.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((item) => item.msg || "Invalid input").join(", "));
      } else {
        setError("Unable to register student.");
      }
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      setCameraError("Camera is not ready yet.");

      return null;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera frame is not available.");

      return null;
    }

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("Unable to capture camera frame.");

      return null;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9,
      );
    });
  };

  const handleCapture = async () => {
    try {
      setCapturing(true);
      setCameraError("");
      setError("");

      const imageBlob = await captureFrame();

      if (!imageBlob) {
        return;
      }

      setSamples((previous) => [...previous, imageBlob]);
    } catch (err) {
      console.error("Face capture error:", err);

      setCameraError("Unable to capture face sample.");
    } finally {
      setCapturing(false);
    }
  };

  const handleRegisterFace = async () => {
    if (!studentId) {
      setError("Student information is missing.");

      return;
    }

    if (samples.length !== 5) {
      setError("Please capture all 5 face samples.");

      return;
    }

    try {
      setRegisteringFace(true);
      setError("");
      setCameraError("");
      setSuccess("");
      setFaceRegistrationFailed(false);

      await registerFaceSamples(studentId, samples);

      stopCamera();

      setSuccess("Student and face registered successfully!");

      setStep(3);
    } catch (err) {
      console.error("Face registration error:", err);

      const detail = err.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item.msg || "Face registration failed")
            .join(", "),
        );
      } else {
        setError("Unable to register face samples.");
      }

      // The student already exists.
      // Only the face samples need to be captured again.
      setFaceRegistrationFailed(true);

      // Clear the previous 5 captured images.
      setSamples([]);
    } finally {
      setRegisteringFace(false);
    }
  };

  const handleRetryFace = () => {
    setSamples([]);
    setError("");
    setCameraError("");
    setSuccess("");
    setFaceRegistrationFailed(false);

    if (!cameraReady) {
      startCamera();
    }
  };

  const handleRegisterAnother = () => {
    stopCamera();

    setStep(1);
    setStudentId(null);
    setSamples([]);
    setError("");
    setCameraError("");
    setSuccess("");
    setFaceRegistrationFailed(false);

    setFormData({
      student_code: "",
      full_name: "",
      email: "",
      mobile_number: "",
      course: "",
      department: "",
      year: "",
      semester: "",
      section: "",
      enrollment_date: "",
      status: "active",
    });
  };

  if (step === 1) {
    return (
      <div className="register-page">
        <div className="register-header">
          <h1>Register Student</h1>

          <p>Enter student information and register their face.</p>
        </div>

        <form className="register-form" onSubmit={handleStudentSubmit}>
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="student_code">Student Code / Roll No.</label>

                <input
                  id="student_code"
                  name="student_code"
                  type="text"
                  value={formData.student_code}
                  onChange={handleChange}
                  placeholder="e.g. STU002"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>

                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile_number">Mobile Number</label>

                <input
                  id="mobile_number"
                  name="mobile_number"
                  type="tel"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Academic Information</h2>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="course">Course / Program</label>

                <input
                  id="course"
                  name="course"
                  type="text"
                  value={formData.course}
                  onChange={handleChange}
                  placeholder="BBA Computer Applications"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>

                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Computer Applications"
                />
              </div>

              <div className="form-group">
                <label htmlFor="year">Year</label>

                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Year</option>

                  <option value="FY">FY</option>

                  <option value="SY">SY</option>

                  <option value="TY">TY</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="semester">Semester</label>

                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Semester</option>

                  <option value="1">Semester 1</option>

                  <option value="2">Semester 2</option>

                  <option value="3">Semester 3</option>

                  <option value="4">Semester 4</option>

                  <option value="5">Semester 5</option>

                  <option value="6">Semester 6</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="section">Section / Division</label>

                <input
                  id="section"
                  name="section"
                  type="text"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="A"
                />
              </div>

              <div className="form-group">
                <label htmlFor="enrollment_date">Enrollment Date</label>

                <input
                  id="enrollment_date"
                  name="enrollment_date"
                  type="date"
                  value={formData.enrollment_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Account Status</h2>

            <div className="form-group">
              <label htmlFor="status">Status</label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>

                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="register-button">
            Register Student & Continue
          </button>
        </form>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="register-page">
        <div className="register-header">
          <h1>Register Face</h1>

          <p>Capture 5 samples for face recognition.</p>
        </div>

        {success && <div className="success-message">{success}</div>}

        {error && <div className="error-message">{error}</div>}

        {cameraError && <div className="error-message">{cameraError}</div>}

        {faceRegistrationFailed && (
          <div className="face-retry-message">
            <h3>Face registration failed</h3>

            <p>
              The student has already been registered. No face samples were
              saved. Capture 5 new samples and try again.
            </p>

            <button
              type="button"
              className="capture-button"
              onClick={handleRetryFace}
            >
              Try Again
            </button>
          </div>
        )}

        <div className="face-camera-card">
          <div className="face-camera-container">
            <video ref={videoRef} autoPlay playsInline muted />

            <div className="face-guide">
              Position your face inside the frame
            </div>
          </div>

          <div className="face-sample-progress">
            <h3>Face Samples</h3>

            <p>{samples.length} / 5 samples captured</p>

            <div className="sample-indicators">
              {[1, 2, 3, 4, 5].map((sample) => (
                <div
                  key={sample}
                  className={
                    sample <= samples.length
                      ? "sample-dot captured"
                      : "sample-dot"
                  }
                >
                  {sample}
                </div>
              ))}
            </div>
          </div>

          <div className="camera-status">
            {cameraReady ? "📷 Camera ready" : "⏳ Starting camera..."}
          </div>

          {samples.length < 5 ? (
            <button
              type="button"
              className="capture-button"
              onClick={handleCapture}
              disabled={!cameraReady || capturing}
            >
              {capturing
                ? "Capturing..."
                : `Capture Sample ${samples.length + 1}`}
            </button>
          ) : (
            <button
              type="button"
              className="register-button"
              onClick={handleRegisterFace}
              disabled={registeringFace}
            >
              {registeringFace
                ? "Registering Face..."
                : "Register 5 Face Samples"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="registration-complete">
        <div className="complete-icon">✅</div>

        <h1>Registration Complete</h1>

        <p>
          Student information and face registration have been completed
          successfully.
        </p>

        <div className="complete-details">
          <p>
            <strong>Student:</strong> {formData.full_name}
          </p>

          <p>
            <strong>Student Code:</strong> {formData.student_code}
          </p>

          <p>
            <strong>Face Samples:</strong> 5 registered
          </p>

          <p>
            <strong>Camera:</strong> 🛑 Stopped
          </p>
        </div>

        <button
          type="button"
          className="register-button"
          onClick={handleRegisterAnother}
        >
          Register Another Student
        </button>
      </div>
    </div>
  );
}

export default RegisterStudent;
