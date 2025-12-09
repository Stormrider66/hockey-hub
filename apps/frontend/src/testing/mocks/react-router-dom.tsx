import React from 'react';

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const MemoryRouter = BrowserRouter;
export const Routes = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const Route = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const Link = ({ children, to }: any) => <a href={to}>{children}</a>;
export const useNavigate = () => jest.fn();
export const useLocation = () => ({ pathname: '/' });
export const useParams = () => ({} as any);
export const useSearchParams = () => [new URLSearchParams(), jest.fn()] as any;
export default {
  BrowserRouter,
  MemoryRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
};




