import { Navigate, Route, Routes } from "react-router-dom"

import HomePage from "./pages/HomePage.jsx"
import LoginPage from "./pages/LoginPage.jsx"
import SignUpPage from "./pages/SignUpPage.jsx"
import AdminPage from "./pages/AdminPage.jsx"
import CategoryPage from "./pages/CategoryPage.jsx"
import CartPage from "./pages/CartPage.jsx"
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage.jsx"
import PurchaseCancelPage from "./pages/PurchaseCancelPage.jsx"

import Navbar from "./components/Navbar.jsx"
import { Toaster } from "react-hot-toast"
import LoadingSpinner from "./components/LoadingSpinner.jsx"
import { useUserStore } from "./stores/useUserStore.js";
import { useCartStore } from "./stores/useCartStore";
import { useEffect } from "react"


function App() {
  const { user, checkAuth, checkingAuth } = useUserStore();

  const { getCartItems } = useCartStore();

  useEffect(() => {
		if (!user) return;
		getCartItems();
	}, [getCartItems, user]);

  useEffect(() => {
		checkAuth();
	}, [checkAuth]);

  if (checkingAuth) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
 
      {/* background gradient */}
      <div className='absolute inset-0 overflow-hidden'>
				<div className='absolute inset-0'>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.3)_0%,rgba(10,80,60,0.3)_45%,rgba(0,0,0,0.1)_100%)]' />
				</div>
			</div>

      <div className='relative z-50 pt-20'>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage/>} />

          <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to='/' />} />

          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to='/' />} />

          <Route path='/secret-dashboard'
						element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />}
					/>

          <Route path='/category/:category' element={<CategoryPage />} />
				
          <Route path='/cart' element={user ? <CartPage /> : <Navigate to='/login' />} />

          <Route
						path='/purchase-success'
						element={user ? <PurchaseSuccessPage /> : <Navigate to='/login' />} />
            
					<Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />

        </Routes>
      </div>
      <Toaster />
    </div>
  )
}

export default App
