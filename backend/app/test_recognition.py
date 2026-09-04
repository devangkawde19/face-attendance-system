import cv2

from .database import SessionLocal
from .face_service import FaceRecognitionService
from .recognition_service import find_matching_student


def main():
    print("Initializing face recognition service...")

    face_service = FaceRecognitionService()

    print("Opening camera...")

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("ERROR: Could not open camera.")
        return

    print("\nCamera started.")
    print("Press C to capture and recognize.")
    print("Press Q to quit.")

    db = SessionLocal()

    try:
        while True:
            success, frame = camera.read()

            if not success:
                print("ERROR: Could not read camera frame.")
                break

            cv2.imshow("Face Recognition Test", frame)

            key = cv2.waitKey(1) & 0xFF

            if key == ord("c"):
                print("\nProcessing frame...")

                try:
                    # Generate new face embedding
                    embedding = face_service.get_embedding(frame)

                    print("Face detected successfully!")
                    print("Embedding dimensions:", len(embedding))

                    # Search database
                    match = find_matching_student(
                        db=db,
                        embedding=embedding,
                        threshold=0.60,
                    )

                    if match:
                        print("\nMATCH FOUND!")
                        print("-----------------------------")
                        print("Student ID:", match["student_id"])
                        print("Student Code:", match["student_code"])
                        print("Name:", match["full_name"])
                        print("Similarity:", match["similarity"])
                        print("Embedding ID:", match["embedding_id"])
                        print("-----------------------------")

                    else:
                        print("\nNO MATCH FOUND")
                        print("Similarity is below the threshold.")

                except ValueError as e:
                    print("\nFace processing failed!")
                    print("Reason:", e)

                except Exception as e:
                    print("\nRecognition failed!")
                    print("Error:", e)

            elif key == ord("q"):
                break

    finally:
        db.close()
        camera.release()
        cv2.destroyAllWindows()

        print("\nCamera closed.")


if __name__ == "__main__":
    main()
