import cv2
import numpy as np

from .face_service import FaceRecognitionService


def main():
    print("Initializing face recognition service...")

    face_service = FaceRecognitionService()

    print("Opening camera...")

    camera = cv2.VideoCapture(0)

    if not camera.isOpened():
        print("ERROR: Could not open camera.")
        return

    print("\nCamera started.")
    print("Press C to capture and process the current frame.")
    print("Press Q to quit.")

    while True:
        success, frame = camera.read()

        if not success:
            print("ERROR: Could not read camera frame.")
            break

        cv2.imshow("Face Recognition Test", frame)

        key = cv2.waitKey(1) & 0xFF

        # Capture frame
        if key == ord("c"):
            print("\nProcessing frame...")

            try:
                embedding = face_service.get_embedding(frame)

                print("Face detected successfully!")
                print("Embedding shape:", embedding.shape)
                print("Embedding dimensions:", len(embedding))
                print("Embedding norm:", np.linalg.norm(embedding))

                print("\nFirst 10 values:")
                print(embedding[:10])

            except ValueError as e:
                print("Face processing failed!")
                print("Reason:", e)

        # Quit
        elif key == ord("q"):
            break

    camera.release()
    cv2.destroyAllWindows()

    print("\nCamera closed.")


if __name__ == "__main__":
    main()
