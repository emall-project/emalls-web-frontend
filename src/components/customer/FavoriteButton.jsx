import React from "react";
import { useNavigate } from "react-router-dom";
import { IoHeart, IoHeartOutline } from "react-icons/io5";

import { auth } from "../../api/auth";
import { useFavorites } from "../../context/FavoritesContext";

export default function FavoriteButton({
  productId,
  size = "text-lg",
  className = "",
  activeClassName = "text-rose-600",
  inactiveClassName = "text-black/45 hover:text-black",
}) {
  const navigate = useNavigate();
  const { isFav, toggleFav } = useFavorites();
  const favorited = isFav(productId);

  const handleClick = async (event) => {
    event.stopPropagation();
    event.preventDefault();

    const user = auth.getUser();
    if (!user || user.role !== "ROLE_CUSTOMER") {
      navigate(`/customer/login?from=/products/${productId}`);
      return;
    }

    try {
      await toggleFav(productId);
    } catch {
      // Keep the UI quiet here; page-level state already rolls back.
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={favorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
      className={`transition-all duration-200 ${className}`}
    >
      {favorited ? (
        <IoHeart className={`${size} ${activeClassName}`} />
      ) : (
        <IoHeartOutline className={`${size} ${inactiveClassName}`} />
      )}
    </button>
  );
}
