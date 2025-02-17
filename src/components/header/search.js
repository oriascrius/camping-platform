"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const Search = () => {
 
  const sassFalse = () => {
    console.log("clicked");
  }
  
  return (
    <form className="d-flex" role="search">
      <input
        className="form-control search-input"
        type="search"
        placeholder="Search"
        aria-label="Search"
        onClick={()=> sassFalse()}
      />
      <button className="btn search-bg" type="submit">
        <Image
          src="/images/header/search.png"
          width={20}
          height={20}
          alt="search"
        />
      </button>
    </form>
  );
};
export default Search;
