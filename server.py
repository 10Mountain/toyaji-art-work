import os
import json
import uuid
import base64
import re
import unicodedata
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORKS_JSON_PATH = os.path.join(BASE_DIR, 'data', 'works.json')
IMAGES_DIR = os.path.join(BASE_DIR, 'images')

os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

INQUIRIES_JSON_PATH = os.path.join(BASE_DIR, 'data', 'inquiries.json')

def clean_year(val):
    if not val:
        return 0
    val = unicodedata.normalize('NFKC', str(val))
    digits = re.sub(r'[^\d]', '', val)
    return int(digits) if digits else 0

def clean_works(works_list):
    for item in works_list:
        cy = clean_year(item.get('year', ''))
        if cy > 0:
            item['year'] = str(cy)
    return works_list

class ToyajiPortfolioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def do_GET(self):
        # API endpoint to get works
        if self.path == '/api/works':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            works = self.load_works()
            self.wfile.write(json.dumps(works, ensure_ascii=False).encode('utf-8'))
            return

        # API endpoint to get inquiries
        if self.path == '/api/inquiries':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            inquiries = self.load_inquiries()
            self.wfile.write(json.dumps(inquiries, ensure_ascii=False).encode('utf-8'))
            return
        
        return super().do_GET()

    def do_POST(self):
        # API endpoint to save or upload works
        if self.path == '/api/works':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Check if image is Base64 data URL, convert & save to images/ folder
                image_url = data.get('image', '')
                if image_url.startswith('data:image/'):
                    saved_path = self.save_base64_image(image_url)
                    if saved_path:
                        data['image'] = saved_path
                
                # Assign ID if missing
                if not data.get('id'):
                    data['id'] = f"work-{int(uuid.uuid4().int % 1000000)}"

                works = self.load_works()
                
                # Check if updating existing or inserting new
                existing_idx = next((i for i, w in enumerate(works) if w.get('id') == data['id']), -1)
                if existing_idx >= 0:
                    works[existing_idx] = data
                else:
                    works.insert(0, data)  # Add new work

                self.save_works(works)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "work": data, "works": works}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Bulk save works endpoint
        if self.path == '/api/works/bulk':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                works = json.loads(post_data.decode('utf-8'))
                
                # Process any Base64 images inside bulk works
                for item in works:
                    img_val = item.get('image', '')
                    if img_val.startswith('data:image/'):
                        saved_path = self.save_base64_image(img_val)
                        if saved_path:
                            item['image'] = saved_path
                
                self.save_works(works)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "count": len(works)}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        # Contact form submission endpoint
        if self.path == '/api/contact':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            try:
                data = json.loads(post_data.decode('utf-8'))
                data['id'] = f"inquiry-{int(uuid.uuid4().int % 1000000)}"
                import datetime
                data['created_at'] = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                inquiries = self.load_inquiries()
                inquiries.insert(0, data)
                self.save_inquiries(inquiries)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "message": "Inquiry recorded locally", "inquiry": data}, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
            return

        return super().do_POST()

    def do_DELETE(self):
        # API endpoint to delete a work by ID
        if self.path.startswith('/api/works/'):
            work_id = self.path.replace('/api/works/', '')
            works = self.load_works()
            updated_works = [w for w in works if w.get('id') != work_id]
            self.save_works(updated_works)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "deleted", "id": work_id, "works": updated_works}, ensure_ascii=False).encode('utf-8'))
            return

    def save_base64_image(self, data_url):
        try:
            # Extract mime format and base64 string
            match = re.match(r'data:image/(\w+);base64,(.+)', data_url)
            if not match:
                return None
            ext = match.group(1)
            if ext == 'jpeg': ext = 'jpg'
            b64_data = match.group(2)
            
            filename = f"art_{uuid.uuid4().hex[:10]}.{ext}"
            file_path = os.path.join(IMAGES_DIR, filename)
            
            with open(file_path, 'wb') as f:
                f.write(base64.b64decode(b64_data))
            
            return f"images/{filename}"
        except Exception as e:
            print(f"Error saving base64 image: {e}")
            return None

    def load_works(self):
        if os.path.exists(WORKS_JSON_PATH):
            try:
                with open(WORKS_JSON_PATH, 'r', encoding='utf-8') as f:
                    works = json.load(f)
                    return clean_works(works)
            except Exception as e:
                print(f"Error loading works.json: {e}")
        return []

    def save_works(self, works):
        works = clean_works(works)
        with open(WORKS_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(works, f, ensure_ascii=False, indent=2)

    def load_inquiries(self):
        if os.path.exists(INQUIRIES_JSON_PATH):
            try:
                with open(INQUIRIES_JSON_PATH, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading inquiries.json: {e}")
        return []

    def save_inquiries(self, inquiries):
        with open(INQUIRIES_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(inquiries, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    print(f"Serving toyaji ART WORK with API at http://localhost:{PORT}")
    server = HTTPServer(('0.0.0.0', PORT), ToyajiPortfolioHandler)
    server.serve_forever()

