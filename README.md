This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

docker run -d --name=rtmp --restart=unless-stopped -p 1935:1935 -p 3002:80 alfg/nginx-rtmp
docker run -d --name=rtmp --restart=unless-stopped -p 8554:8554 -p 3002:8888 bluenviron/mediamtx

ffmpeg -re \
-f lavfi -i testsrc2=size=960x540 \
-f lavfi -i aevalsrc="sin(0*2*PI*t)" \
-vcodec libx264 \
-r 30 -g 30 \
-preset fast -vb 3000k -pix_fmt rgb24 \
-pix_fmt yuv420p \
-f flv \
rtmp://live-fra.twitch.tv/app/STREAMKEY

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
