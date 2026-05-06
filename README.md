# E-Malls Frontend (React)

واجهة الويب لمشروع **E-Malls** مبنية باستخدام **React**.  
المشروع متعدد الأدوار: **Customer / Shop Owner / Admin**.

---

## Why Vite?
اخترنا **Vite** بدل Create React App (CRA) لأنه:
- أسرع في تشغيل المشروع (Dev Server) وأفضل في **HMR** (Hot Module Replacement)
- وقت بناء (Build) أسرع وأخف
- إعداد حديث (Modern tooling) مناسب لمشاريع كبيرة وقابلية توسّع أفضل

---

## Tech Stack
- React
- React Router
- Axios
- (TBD) State Management: Redux Toolkit أو React Query
- UI Library: (TBD)

---

## Docker

Build the production image:

```sh
docker build \
  --build-arg VITE_STRIPE_PUBLISHABLE="$VITE_STRIPE_PUBLISHABLE_KEY" \
  -t emalls-web-frontend:local .
```

Run it locally:

```sh
docker run --rm -p 8080:80 emalls-web-frontend:local
```

Or use Compose:

```sh
docker compose up --build
```

With the included base environment file:

```sh
docker compose --env-file base.env up --build
```

Useful environment variables:

- `FRONTEND_PORT`: host port for Compose, defaults to `8080`.
- `API_UPSTREAM`: backend gateway URL proxied by Nginx, defaults to `https://api.e-mall.store`.
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key embedded at build time.

---

## Project Structure (planned)
```txt
src/
  pages/        # الشاشات
  components/   # مكوّنات قابلة لإعادة الاستخدام
  services/     # API calls (Axios instance)
  hooks/        # Custom hooks
  assets/       # صور/أيقونات
  styles/       # Theme / global styles
