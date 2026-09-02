import cv2
import insightface

print("Loading InsightFace...")

face_app = insightface.app.FaceAnalysis(
    name="buffalo_l", providers=["CPUExecutionProvider"]
)

face_app.prepare(ctx_id=0, det_size=(256, 256))

print("Model loaded.")
print("Starting camera...")
print("Press C to capture.")
print("Press Q to quit.")

camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Could not open camera.")
    exit()

message = "Position your face, then press C"
message_time = 0

while True:
    success, frame = camera.read()

    if not success:
        print("Could not read frame.")
        break

    # Keep camera preview completely live.
    display_frame = frame.copy()

    cv2.putText(
        display_frame,
        "Press C = Capture | Q = Quit",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2,
    )

    cv2.putText(
        display_frame, message, (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2
    )

    cv2.imshow("Student Registration", display_frame)

    key = cv2.waitKey(1) & 0xFF

    # Capture current frame
    if key == ord("c"):
        print("\nProcessing captured frame...")

        faces = face_app.get(frame)

        if len(faces) == 0:
            message = "No face detected - try again"
            print("No face detected.")

        elif len(faces) > 1:
            message = "Multiple faces detected - try again"
            print(f"Multiple faces detected: {len(faces)}")

        else:
            face = faces[0]

            x1, y1, x2, y2 = map(int, face.bbox)

            face_width = x2 - x1
            face_height = y2 - y1

            if face_width < 120 or face_height < 120:
                message = "Move closer and capture again"
                print("Face is too small.")

            else:
                embedding = face.embedding

                print("Face captured successfully!")
                print(f"Embedding dimensions: {len(embedding)}")
                print("Embedding generated successfully.")

                message = "Face captured successfully!"

                # Show captured face
                captured_frame = frame.copy()

                cv2.rectangle(captured_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

                cv2.putText(
                    captured_frame,
                    "CAPTURED",
                    (x1, max(y1 - 10, 20)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 0),
                    2,
                )

                cv2.imshow("Captured Face", captured_frame)

                print("Press any key in the captured window to continue.")

                cv2.waitKey(0)
                cv2.destroyWindow("Captured Face")

    elif key == ord("q"):
        break

camera.release()
cv2.destroyAllWindows()
