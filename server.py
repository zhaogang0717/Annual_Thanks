#!/usr/bin/env python3
"""
简单的HTTP服务器，用于在手机上查看年度总结页面
使用方法：python3 server.py
"""

import http.server
import socketserver
import socket

PORT = 8000

def get_local_ip():
    """获取本机IP地址"""
    try:
        # 连接到一个远程地址来获取本机IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加CORS头，允许跨域访问
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    local_ip = get_local_ip()
    url = f"http://{local_ip}:{PORT}"
    
    print("=" * 60)
    print("🐬 2025年度工作总结服务器启动成功！")
    print("=" * 60)
    print(f"📱 手机访问地址: {url}")
    print(f"💻 电脑访问地址: http://localhost:{PORT}")
    print("=" * 60)
    
    # 显示二维码链接
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={url}"
    print("📱 手机扫描二维码访问:")
    print(f"   在浏览器中打开: {qr_url}")
    print("   或者直接输入上面的手机访问地址")
    print()
    print("=" * 60)
    print("💡 提示:")
    print("1. 确保手机和电脑在同一个WiFi网络下")
    print("2. 如果无法访问，请检查防火墙设置")
    print("3. 按 Ctrl+C 停止服务器")
    print("=" * 60)
    
    # 启动服务器
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 服务器已停止")

if __name__ == "__main__":
    main()