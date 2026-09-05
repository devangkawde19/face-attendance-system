import { useCallback, useEffect, useRef, useState } from "react";

import { recognizeAndMarkAttendance } from "../services/api";

function MarkAttendance() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraError, setCameraError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera access is not supported by this browser.");
        return;
      }

      if (streamRef.current) {
        stopCamera();
      }

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

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraReady(true);
    } catch (error) {
      console.error("Camera error:", error);

      setCameraReady(false);

      setCameraError(
        "Unable to access camera. Please allow camera permission and try again.",
      );
    }
  }, [stopCamera]);

  useEffect(() => {
    let cancelled = false;

    const videoElement = videoRef.current;

    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (!cancelled) {
            setCameraError("Camera access is not supported by this browser.");
          }

          return;
        }

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

        if (videoElement) {
          videoElement.srcObject = stream;
        }

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
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });

        streamRef.current = null;
      }

      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, []);

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

  const handleStartCamera = async () => {
    setResult(null);
    await startCamera();
  };

  return (
    <div className="attendance-camera-page">
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

        {cameraReady ? (
          <button
            type="button"
            className="capture-button"
            onClick={handleMarkAttendance}
            disabled={processing}
          >
            {processing
              ? "Recognizing..."
              : result?.recognized
                ? "Attendance Completed"
                : "Capture & Mark Attendance"}
          </button>
        ) : (
          <button
            type="button"
            className="capture-button"
            onClick={handleStartCamera}
            disabled={processing}
          >
            Start Camera
          </button>
        )}
      </div>

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
