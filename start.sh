#!/bin/bash

echo "🐬 启动2025年度工作总结服务器..."
echo ""

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: 未找到Python3，请先安装Python"
    exit 1
fi

# 启动服务器
python3 server.py