from PIL import Image
import os

src_path = '/home/rajeev/.gemini/antigravity/brain/5a892bd9-8b1c-46a8-bc1d-f2241325a226/.user_uploaded/media_1788758386807.png'
dest_path = '/home/rajeev/pixelbuilders/shreebanarsisarees/public/our_store_banner.png'

if os.path.exists(src_path):
    img = Image.open(src_path)
    width, height = img.size
    print(f"Loaded image size: {width}x{height}")
    
    # In media_1788758386807.png, the top navigation header is roughly top 0..58
    # The banner image starts around y=58 and ends around y=320.
    # Let's inspect pixel brightness to find the exact banner boundary:
    banner_top = 58
    banner_bottom = 320
    
    # We crop the banner:
    banner = img.crop((0, banner_top, width, banner_bottom))
    banner.save(dest_path)
    print(f"Saved banner to {dest_path} with size {banner.size}")
