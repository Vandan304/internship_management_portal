import os
from rembg import remove

def process_image(input_path):
    output_path = input_path
    
    with open(input_path, 'rb') as i:
        input_bytes = i.read()
        
    output_bytes = remove(input_bytes)
    
    with open(output_path, 'wb') as o:
        o.write(output_bytes)
    print(f"Processed: {input_path}")

files = [
    r'frontend/src/assets/medals/medal_1.png',
    r'frontend/src/assets/medals/medal_2.png',
    r'frontend/src/assets/medals/medal_3.png'
]

for f in files:
    if os.path.exists(f):
        try:
            process_image(f)
        except Exception as e:
            print(f"Error processing {f}: {e}")
    else:
        print(f"File not found: {f}")
