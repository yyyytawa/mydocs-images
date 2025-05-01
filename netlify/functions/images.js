export default async (request, context) => {
    const imagePath = new URL(request.url).pathname; // 直接获取路径
  
    try {
      // 1. 尝试从本地读取文件
      const localResponse = await context.netlify.edge.readFile({ path: imagePath });
  
      if (localResponse) {
        console.log("Serving local image:", imagePath);
        return new Response(localResponse, {
          headers: {
            "Content-Type": localResponse.type, // 设置 Content-Type
            "Cache-Control": "public, max-age=31536000", // 缓存一年
            "CDN-Cache-Control": "public, max-age=31536000",
          },
        });
      }
    } catch (error) {
      // 本地文件不存在，忽略错误
      console.log("Local image not found:", imagePath);
    }
  
    // 2. 如果本地文件不存在，则代理到源服务器 img.yyyyt.top
    const originImageUrl = `https://img.yyyyt.top${imagePath}`;
    console.log("Proxying to origin:", originImageUrl);
  
    try {
      const originResponse = await fetch(originImageUrl);
  
      if (!originResponse.ok) {
        console.warn("Origin server error:", originResponse.status, originImageUrl);
        return new Response("Image not found", { status: 404 }); // 返回 404
      }
  
      // 使用源服务器的响应，直接传递
      return new Response(originResponse.body, {
        status: originResponse.status, // 传递状态码
        headers: {
          "Content-Type": originResponse.headers.get("Content-Type"), // 传递 Content-Type
          "Cache-Control": "public, max-age=31536000", // 缓存一年
          "CDN-Cache-Control": "public, max-age=31536000",
        },
      });
    } catch (error) {
      console.error("Error fetching from origin:", error, originImageUrl);
      return new Response("Image not available", { status: 500 }); // 返回 500
    }
  };
  
  export const config = {
    path: "/*", // 拦截所有请求
  };
  