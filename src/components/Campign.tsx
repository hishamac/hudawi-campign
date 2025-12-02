"use client";
import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { toPng } from "html-to-image";
import Modal from "./Model";
import { CroppedArea } from "@/libs/types";

interface Registration {
  programCode: string;
  name: string;
}

interface Candidate {
  chestNo: string;
  name: string;
  section: string;
  team: string;
  registrations: Registration[];
}

const PosterCampaign = () => {
  const [inputValue, setInputValue] = useState("");
  const [chestNo, setChestNo] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedArea | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const handleChestNoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChestNo(event.target.value);
    setError("");
  };

  const handleCheck = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!chestNo) {
      setError("Please enter a Chest No");
      return;
    }

    try {
      const res = await fetch("/data.json");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data: Candidate[] = await res.json();
      const found = data.find(
        (c) => c.chestNo.toLowerCase() === chestNo.toLowerCase()
      );

      if (found) {
        setCandidate(found);
        setInputValue(found.name);
        setError("");
      } else {
        setCandidate(null);
        setInputValue("");
        setError("Candidate not found");
      }
    } catch (err) {
      console.error(err);
      setError("Error loading data");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (candidate) {
      setIsModalOpen(true);
    } else {
      setError("Please find a candidate first");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log(event.target.files);

    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleCropComplete = useCallback(
    (_: any, croppedAreaPixels: CroppedArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const applyCrop = useCallback(() => {
    if (!selectedImage || !croppedAreaPixels) return;

    const image = new Image();
    image.src = selectedImage;
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      setCroppedImage(canvas.toDataURL("image/png"));
      setIsModalOpen(false);
    };
  }, [selectedImage, croppedAreaPixels]);

  const downloadPoster = async () => {
    const posterElement = document.getElementById("poster-container");
    if (!posterElement) return;

    try {
      const dataUrl = await toPng(posterElement, {
        pixelRatio: 3,
      });
      const link = document.createElement("a");
      link.download = `${candidate?.name || "poster"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
      alert("Failed to download image. Please try again.");
    }
  };

  const clearPoster = () => {
    setInputValue("");
    setChestNo("");
    setCandidate(null);
    setError("");
    setSelectedImage(null);
    setCroppedImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  return (
    <>  
    <div className="flex items-center justify-center w-full h-full  bg-[#e11962] bg-opacity-10">
      <div className="flex items-center justify-center flex-col sm:flex-row my-3 mx-2 space-y-8 sm:space-y-0 p-10 bg-[#e11962] rounded-3xl w-96 sm:w-[40rem] ">

        <div className="overflow-hidden w-[20rem] sm:w-[20rem] rounded-3xl">
          <div id="poster-container" className="container poster bg-white relative ">
            <img src="/poster.png" alt="" className="w-full" />

            {/* Section below "Category:" */}
            {candidate && (
              <div className="absolute top-[76px] sm:top-[66px] left-0 right-0 text-center z-30">
                <p className="text-[#FAE5BC] font-degular italic font-semibold uppercase text-[8px] sm:text-[10.6px]">
                  {candidate.section}
                </p>
              </div>
            )}

            {/* Candidate Image */}
            {croppedImage ? (
              <img
                src={croppedImage}
                alt=""
                className="rounded-[40%] absolute sm:top-[5.3rem] sm:left-[103px] sm:w-[4.5rem] top-[6rem] left-[120px] w-[5rem]"
              // style={{
              //   zIndex: 100,
              // }}
              />
            ) : (
              <></>
            )}

            {/* Name, Team, and Programs below image */}
            {candidate && (
              <div className="absolute top-[193px] sm:top-[165.2px] left-0 right-0 flex flex-col items-center z-30">
                {/* Name (EB Garamond Semi-bold Italic 15.25px) */}
                <p className="text-white font-garamond font-semibold italic capitalize text-[12px] sm:text-[15.25px]">
                  {candidate.name.toLowerCase()}
                </p>

                {/* Team (Plus Jakarta Sans Regular 7px) */}
                <p className="text-[#FAE5BC] font-jakarta font-normal uppercase mt-0.5 text-[5.5px] sm:text-[7px]">
                  {candidate.team}
                </p>

                {/* Programs list (Plus Jakarta Sans Medium 9.6px) */}
                <div className="flex flex-col items-center mt-1 space-y-0.5">
                  {candidate.registrations.map((reg) => (
                    <p key={reg.programCode} className="text-white font-jakarta font-medium capitalize leading-3 text-[7.5px] sm:text-[9.6px]">
                      {reg.name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <img
              src="/poster.png"
              alt=""
              className="w-full absolute z-20 top-0 pointer-events-none"
            />
          </div>
        </div>
        <div className="flex flex-col w-[20rem] justify-start px-4 sm:pr-0 sm:pl-8 text-white">
          <h1 className={`text-2xl text-center leading-7`}>
            Participate in <br />{" "}
            <span className="font-semibold">
              SHEFEST MAHDIYYA
            </span>{" "}
            Poster Campaign
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col mt-2">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={chestNo}
                onChange={handleChestNoChange}
                placeholder="Enter Chest No"
                className="py-3 text-black px-4 border-2 rounded-full w-full"
              />
              <button
                onClick={handleCheck}
                className="bg-white text-[#ef6339] font-bold rounded-full px-4 border-2 border-white hover:bg-gray-100"
              >
                Check
              </button>
            </div>
            {error && <p className="text-white bg-red-500 px-2 py-1 rounded mb-2 text-sm text-center">{error}</p>}

            {candidate && (
              <button
                type="submit"
                className="bg-red border-2 border-white flex items-center justify-center rounded-full py-3 text-center px-4 gap-2 text-white"
              >
                {" "}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-white h-4 w-4"
                  id="Layer_1"
                  data-name="Layer 1"
                  viewBox="0 0 24 24"
                  width="512"
                  height="512"
                >
                  <path d="M8.5,5c.83,0,1.5,.67,1.5,1.5s-.67,1.5-1.5,1.5-1.5-.67-1.5-1.5,.67-1.5,1.5-1.5Zm7.32,3.18l-.35-1.42c-.11-.44-.51-.76-.97-.76s-.86,.31-.97,.76l-.35,1.41-1.4,.32c-.45,.1-.77,.5-.77,.96,0,.46,.3,.86,.74,.98l1.43,.39,.36,1.43c.11,.44,.51,.76,.97,.76s.86-.31,.97-.76l.35-1.42,1.42-.35c.44-.11,.76-.51,.76-.97s-.31-.86-.76-.97l-1.42-.35Zm.79-3.3l1.76,.74,.7,1.75c.15,.38,.52,.63,.93,.63s.78-.25,.93-.63l.7-1.74,1.74-.7c.38-.15,.63-.52,.63-.93s-.25-.78-.63-.93l-1.74-.7-.7-1.74c-.15-.38-.52-.63-.93-.63s-.78,.25-.93,.63l-.69,1.73-1.73,.66c-.38,.14-.64,.51-.65,.92,0,.41,.23,.78,.61,.94Zm7.39,4.12v10c0,2.76-2.24,5-5,5H5c-2.76,0-5-2.24-5-5V5C0,2.24,2.24,0,5,0H15c.55,0,1,.45,1,1s-.45,1-1,1H5c-1.65,0-3,1.35-3,3v6.59l.56-.56c1.34-1.34,3.53-1.34,4.88,0l5.58,5.58c.54,.54,1.43,.54,1.97,0l.58-.58c1.34-1.34,3.53-1.34,4.88,0l1.56,1.56V9c0-.55,.45-1,1-1s1,.45,1,1Zm-2.24,11.17l-2.74-2.74c-.56-.56-1.48-.56-2.05,0l-.58,.58c-1.32,1.32-3.48,1.32-4.8,0l-5.58-5.58c-.56-.56-1.48-.56-2.05,0l-1.98,1.98v4.59c0,1.65,1.35,3,3,3h14c1.24,0,2.3-.75,2.76-1.83Z" />
                </svg>{" "}
                Create with your photo{" "}
              </button>
            )}

            <Modal
              isOpen={isModalOpen}
              setIsOpen={setIsModalOpen}
              onClose={closeModal}
              title="Crop Your Image"
            >
              <div className="flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="border-2 border-black rounded-lg w-3/4 mb-4"
                />
                {selectedImage && (
                  <div className="w-3/4 relative h-96 rounded-lg">
                    <div className=" relative h-72">
                      <div className="crop-container">
                        <Cropper
                          image={selectedImage}
                          crop={crop}
                          zoom={zoom}
                          aspect={4 / 4.4}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={handleCropComplete}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={applyCrop}
                      className="py-2 px-4 bg-green text-black border-black border-2 rounded-lg mt-4 w-full"
                    >
                      Apply Crop
                    </button>
                  </div>
                )}
              </div>
            </Modal>
          </form>
          {croppedImage && (
            <div className="mt-4 flex justify-center space-x-2 flex-row text-center sm:pt-2">
              <button
                onClick={downloadPoster}
                className="px-7 py-2 bg-green text-white rounded-full border-2 border-white flex justify-center items-center gap-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-white"
                  viewBox="0 0 512 512"
                  width="15"
                  height="15"
                >
                  <g>
                    <path d="M188.821,377.6c37.49,37.491,98.274,37.491,135.765,0.001c0,0,0.001-0.001,0.001-0.001l68.523-68.523c12.712-12.278,13.064-32.536,0.786-45.248c-12.278-12.712-32.536-13.064-45.248-0.786c-0.267,0.257-0.529,0.52-0.786,0.786l-59.371,59.349L288,32c0-17.673-14.327-32-32-32l0,0c-17.673,0-32,14.327-32,32l0.448,290.709l-58.901-58.901c-12.712-12.278-32.97-11.926-45.248,0.786c-11.977,12.401-11.977,32.061,0,44.462L188.821,377.6z" />
                    <path d="M480,309.333c-17.673,0-32,14.327-32,32v97.941c-0.012,4.814-3.911,8.714-8.725,8.725H72.725c-4.814-0.012-8.714-3.911-8.725-8.725v-97.941c0-17.673-14.327-32-32-32s-32,14.327-32,32v97.941C0.047,479.42,32.58,511.953,72.725,512h366.549c40.146-0.047,72.678-32.58,72.725-72.725v-97.941C512,323.66,497.673,309.333,480,309.333z" />
                  </g>
                </svg>
                Download
              </button>
              <a
                className="px-[0.625rem] py-2 border-2 border-white text-white rounded-full cursor-pointer"
                onClick={clearPoster}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  className="fill-white"
                >
                  <path d="m23,21h-8.633l8.174-8.205c1.939-1.946,1.939-5.113,0-7.06l-3.254-3.265c-.945-.948-2.203-1.47-3.541-1.47s-2.597.522-3.54,1.468L1.459,13.175c-1.939,1.946-1.939,5.113,0,7.059l1.583,1.589c.745.748,1.777,1.177,2.834,1.177h17.124c.553,0,1-.448,1-1s-.447-1-1-1ZM13.62,3.882c.567-.569,1.322-.882,2.126-.882s1.558.313,2.125.882l3.254,3.265c1.163,1.167,1.163,3.068,0,4.236l-4.97,4.989-7.509-7.534,4.974-4.955Zm-7.744,17.118c-.536,0-1.039-.209-1.417-.588l-1.584-1.589c-1.163-1.167-1.163-3.067-.002-4.232l4.357-4.341,7.514,7.54-3.199,3.211h-5.669Z" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

     
    </div>
     {/* Festie Promotional Footer */}
      <div className="mt-6 mb-4 text-center">
        <a
          href="https://www.festie.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-all duration-300 group"
        >
          <span className="text-[#d41e1e] text-xs opacity-80 group-hover:opacity-100">Built with</span>
          <img src="/festie-logo.png" alt="Festie" className="h-5 w-auto" />
          <span className="text-[#d41e1e] text-xs opacity-80 group-hover:opacity-100">• Make your fest alive</span>
        </a>
      </div>
    </>
  );
};

export default PosterCampaign;
