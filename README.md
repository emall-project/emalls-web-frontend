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

## Project Structure (planned)
```txt
src/
  pages/        # الشاشات
  components/   # مكوّنات قابلة لإعادة الاستخدام
  services/     # API calls (Axios instance)
  hooks/        # Custom hooks
  assets/       # صور/أيقونات
  styles/       # Theme / global styles
