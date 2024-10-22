import mss
import cv2.text as cvt


if __name__ == "__main__":
    with mss.mss() as sct:
        # Get information of monitor 1
        monitor_number = 1
        mon = sct.monitors[monitor_number]

        # The screen part to capture
        monitor = {
            "top": mon["top"] + 80,  # 80px from the top
            "left": mon["left"] + 100,  # 100px from the left
            "width": 200,
            "height": 300,
            "mon": monitor_number,
        }
        output = "sct-mon{mon}_{top}x{left}_{width}x{height}.png".format(**monitor)

        # Grab the data
        sct_img = sct.grab(monitor)

        # Save to the picture file
        mss.tools.to_png(sct_img.rgb, sct_img.size, output=output)

        cvt.TextDetectorCNN.create()
