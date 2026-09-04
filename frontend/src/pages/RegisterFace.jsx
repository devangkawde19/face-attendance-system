import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { getStudents, registerFaceSamples } from "../services/api";

function RegisterFace() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);

  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [samples, setSamples] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [registeringFace, setRegisteringFace] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [registrationComplete, setRegistrationComplete] = useState(false);

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

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported by this browser.");

        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());

        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
    } catch (err) {
      console.error("Camera error:", err);

      if (!mountedRef.current) {
        return;
      }

      setCameraError(
        "Unable to access camera. Please allow camera permission and try again.",
      );

      setCameraReady(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    const loadStudent = async () => {
      try {
        const data = await getStudents();

        if (!mountedRef.current) {
          return;
        }

        const foundStudent = data.students?.find(
          (item) => item.id === Number(studentId),
        );

        if (!foundStudent) {
          setError("Student not found.");
          setLoadingStudent(false);
          return;
        }

        setStudent(foundStudent);
        setLoadingStudent(false);

        await startCamera();
      } catch (err) {
        console.error("Failed to load student:", err);

        if (!mountedRef.current) {
          return;
        }

        setError("Unable to load student information.");

        setLoadingStudent(false);
      }
    };

    loadStudent();

    // Save the current video element for cleanup.
    const videoElement = videoRef.current;

    return () => {
      mountedRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());

        streamRef.current = null;
      }

      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [studentId]);

  const captureFrame = () => {
    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      setCameraError("Camera is not ready yet.");

      return null;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("Camera frame is not available yet.");

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
    if (!student) {
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

      await registerFaceSamples(student.id, samples);

      stopCamera();

      setSuccess("Face registered successfully!");

      setRegistrationComplete(true);
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

      setSamples([]);
    } finally {
      setRegisteringFace(false);
    }
  };

  const handleRetry = async () => {
    setSamples([]);
    setError("");
    setCameraError("");
    setSuccess("");
    setRegistrationComplete(false);

    if (!cameraReady) {
      await startCamera();
    }
  };

  const handleClearSamples = () => {
    setSamples([]);
    setError("");
    setCameraError("");
    setSuccess("");
  };

  if (loadingStudent) {
    return (
      <div className="register-page">
        <div className="loading-message">Loading student information...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="register-page">
        <div className="error-message">{error || "Student not found."}</div>

        <Link to="/students" className="register-button">
          Back to Students
        </Link>
      </div>
    );
  }

  if (registrationComplete) {
    return (
      <div className="register-page">
        <div className="registration-complete">
          <div className="complete-icon">✅</div>

          <h1>Face Registration Complete</h1>

          <p>
            The face of <strong>{student.full_name}</strong> has been
            successfully registered.
          </p>

          <div className="complete-details">
            <p>
              <strong>Student Code:</strong> {student.student_code}
            </p>

            <p>
              <strong>Face Samples:</strong> 5 registered
            </p>

            <p>
              <strong>Camera:</strong> 🛑 Stopped
            </p>
          </div>

          <div className="registration-actions">
            <Link to="/students" className="register-button">
              Back to Students
            </Link>

            <button
              type="button"
              className="capture-button"
              onClick={handleRetry}
            >
              Register Face Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-header">
        <h1>Register Face</h1>

        <p>Register face samples for the existing student.</p>
      </div>

      <div className="student-face-info">
        <h2>{student.full_name}</h2>

        <p>
          Student Code: <strong>{student.student_code}</strong>
        </p>

        <p>
          Current Face Samples: <strong>{student.face_samples}</strong>
        </p>

        {student.face_status === "incomplete" && (
          <p>
            <strong>
              Existing incomplete face data will be replaced after all 5 new
              samples are successfully validated.
            </strong>
          </p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {success && <div className="success-message">{success}</div>}

      {cameraError && <div className="error-message">{cameraError}</div>}

      <div className="face-camera-card">
        <div className="face-camera-container">
          <video ref={videoRef} autoPlay playsInline muted />

          <div className="face-guide">Position your face inside the frame</div>
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

        <button
          type="button"
          className="secondary-button"
          onClick={handleClearSamples}
          disabled={samples.length === 0 || registeringFace}
        >
          Clear Samples
        </button>

        <button
          type="button"
          className="back-link"
          onClick={() => {
            stopCamera();
            navigate("/students");
          }}
        >
          ← Back to Students
        </button>
      </div>
    </div>
  );
}

export default RegisterFace;
