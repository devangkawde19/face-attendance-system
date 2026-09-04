import { useEffect, useRef, useState } from "react";
import { recognizeAndMarkAttendance } from "../services/api";

function MarkAttendance() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  // =========================================================
  // UPDATED: CAMERA READY STATE
  // =========================================================

  const [cameraReady, setCameraReady] = useState(false);

  // =========================================================
  // STOP CAMERA
  // =========================================================

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // UPDATED
    setCameraReady(false);
  };

  // =========================================================
  // CAMERA SETUP
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => {
            track.stop();
          });

          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // UPDATED
        setCameraReady(true);
      } catch (error) {
        console.error("Camera error:", error);

        if (!cancelled) {
          setCameraError(
            "Unable to access camera. Please allow camera permission and try again.",
          );

          setCameraReady(false);
        }
      }
    };

    setupCamera();

    return () => {
      cancelled = true;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());

        streamRef.current = null;
      }
    };
  }, []);

  // =========================================================
  // CAPTURE CAMERA FRAME
  // =========================================================

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

  // =========================================================
  // MARK ATTENDANCE
  // =========================================================

  const handleMarkAttendance = async () => {
    try {
      setProcessing(true);
      setResult(null);
      setCameraError("");

      const imageBlob = await captureFrame();

      if (!imageBlob) {
        return;
      }

      const response = await recognizeAndMarkAttendance(imageBlob);

      setResult(response);

      // =====================================================
      // UPDATED: STOP CAMERA AFTER RECOGNITION
      // =====================================================

      if (response.recognized) {
        stopCamera();
      }
    } catch (error) {
      console.error("Attendance error:", error);

      const detail = error.response?.data?.detail;

      let message = "Something went wrong while marking attendance.";

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map((item) => item.msg || "Invalid request")
          .join(", ");
      }

      setCameraError(message);
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <h1>Mark Attendance</h1>

        <p>Look at the camera and capture your face to mark attendance.</p>
      </div>

      <div className="camera-card">
        {cameraError && <div className="error-message">{cameraError}</div>}

        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline muted />

          <div className="face-guide">Position your face inside the frame</div>
        </div>

        <button
          type="button"
          className="capture-button"
          onClick={handleMarkAttendance}
          disabled={processing || !cameraReady}
        >
          {processing
            ? "Recognizing..."
            : result?.recognized
              ? "Attendance Completed"
              : "Capture & Mark Attendance"}
        </button>
      </div>

      {/* ===================================================
          RESULT
      =================================================== */}

      {result && (
        <div className="result-card">
          {!result.recognized ? (
            <>
              <h2>Face Not Recognized</h2>

              <p>{result.message || "No matching student found."}</p>
            </>
          ) : result.already_marked ? (
            <>
              <h2>Attendance Already Marked</h2>

              <p>
                <strong>{result.student.full_name}</strong> has already marked
                attendance today.
              </p>

              <div className="result-details">
                <p>
                  Student Code: <strong>{result.student.student_code}</strong>
                </p>

                <p>
                  Similarity:{" "}
                  <strong>{(result.similarity * 100).toFixed(2)}%</strong>
                </p>

                <p>
                  Status: <strong>{result.attendance.status}</strong>
                </p>
              </div>

              <p className="camera-status">
                📷 Camera stopped after attendance.
              </p>
            </>
          ) : (
            <>
              <h2>Attendance Marked Successfully</h2>

              <p>
                Welcome, <strong>{result.student.full_name}</strong>!
              </p>

              <div className="result-details">
                <p>
                  Student Code: <strong>{result.student.student_code}</strong>
                </p>

                <p>
                  Similarity:{" "}
                  <strong>{(result.similarity * 100).toFixed(2)}%</strong>
                </p>

                <p>
                  Status: <strong>{result.attendance.status}</strong>
                </p>
              </div>

              <p className="camera-status">
                📷 Camera stopped after attendance.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default MarkAttendance;
