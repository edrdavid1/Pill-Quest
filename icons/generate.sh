#!/bin/bash
# Скрипт для генерации иконок разных размеров из SVG

cd "$(dirname "$0")"

# Проверяем, есть ли rsvg-convert или используем альтернативу
if command -v rsvg-convert &> /dev/null; then
    echo "Генерация иконок через rsvg-convert..."
    for size in 72 96 128 144 152 192 384 512; do
        rsvg-convert -w $size -h $size icon.svg -o icon-${size}x${size}.png
        echo "✓ icon-${size}x${size}.png"
    done
elif command -v convert &> /dev/null; then
    echo "Генерация иконок через ImageMagick..."
    for size in 72 96 128 144 152 192 384 512; do
        convert -background none -resize ${size}x${size} icon.svg icon-${size}x${size}.png
        echo "✓ icon-${size}x${size}.png"
    done
else
    echo "❌ Не найден инструмент для конвертации SVG в PNG"
    echo ""
    echo "Установите один из вариантов:"
    echo "  1. librsvg: brew install librsvg"
    echo "  2. ImageMagick: brew install imagemagick"
    echo ""
    echo "Или откройте icons/generate-icons.html в браузере"
    exit 1
fi

echo ""
echo "✅ Все иконки сгенерированы!"
