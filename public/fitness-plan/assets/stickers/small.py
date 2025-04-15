from PIL import Image
import os

def resize_pngs(target_size=(40, 40)):
    """将当前目录下所有PNG图片调整为指定大小"""
    #输出当前目录下所有PNG图片的文件名
    print("当前目录下的PNG图片文件:")


    png_files = [f for f in os.listdir('.') if 1]
    for png_file in png_files:
        print(png_file)
    for filename in os.listdir('.'):
        if filename.lower().endswith('.png'):
            try:
                with Image.open(filename) as img:
                    # 使用高质量抗锯齿算法调整大小
                    resized_img = img.resize(target_size, Image.LANCZOS)
                    
                    # 保留原始透明度通道（如果是RGBA模式）
                    if img.mode == 'RGBA':
                        resized_img.save(filename, 'PNG', optimize=True)
                    else:
                        resized_img.save(filename, 'PNG', quality=95, optimize=True)
                    
                    print(f"✅ 已处理: {filename}")
                    
            except Exception as e:
                print(f"❌ 处理失败 [{filename}]: {str(e)}")

if __name__ == "__main__":
    resize_pngs()