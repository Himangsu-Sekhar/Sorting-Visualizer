var main = document.querySelector("#main");
var crsr = document.querySelector(".cursor");

main.addEventListener("mousemove",function(dets){
   crsr.style.left = dets.x+"px";
   crsr.style.top = dets.y+"px";
})
let numbers = [];

document.getElementById("add").addEventListener("click", () => {
  const input = document.getElementById("numInput");
  const value = input.value.trim();

  if (value === "" || isNaN(value)) {
    // shake instead of alert
    input.classList.add("shake");

    // remove the shake class after animation ends
    setTimeout(() => {
      input.classList.remove("shake");
      input.style.border = "3px solid #000"; // reset to normal
    }, 300);

    input.value = "";
    return;
  }

  numbers.push(Number(value));
  input.value = "";
  renderArray();
});


// function renderArray() {
//   const box = document.getElementById("arrayBox");
//   box.innerHTML = ""; // clear old content

//   numbers.forEach((num, i) => {
//     const element = document.createElement("div");
//     element.classList.add("element");

//     const valDiv = document.createElement("div");
//     valDiv.classList.add("value");
//     valDiv.textContent = num;

//     const idxDiv = document.createElement("div");
//     idxDiv.classList.add("index");
//     idxDiv.textContent = i;

//     element.appendChild(valDiv);
//     element.appendChild(idxDiv);
//     box.appendChild(element);
//   });
// }
// document.getElementById("clear").addEventListener("click", ()=>{
//     numbers = [];
//     renderArray();
// });

function renderArray(highlight1 = -1, highlight2 = -1) {
  const box = document.getElementById("arrayBox");
  box.innerHTML = ""; // clear old content

  numbers.forEach((num, i) => {
    const element = document.createElement("div");
    element.classList.add("element");

    const valDiv = document.createElement("div");
    valDiv.classList.add("value");
    valDiv.textContent = num;

    if (i === highlight1 || i === highlight2) {
      valDiv.style.background = "red";
      valDiv.style.color = "white";
    }

    const idxDiv = document.createElement("div");
    idxDiv.classList.add("index");
    idxDiv.textContent = i;

    element.appendChild(valDiv);
    element.appendChild(idxDiv);
    box.appendChild(element);

    // animate entry
    requestAnimationFrame(() => {
      element.classList.add("show");
    });
  });
}


document.getElementById("clear").addEventListener("click", () => {
  const box = document.getElementById("arrayBox");
  const elements = box.querySelectorAll(".element");
  
  let selemt = document.getElementById("sortedBox");
  let srmelemt = selemt.querySelectorAll(".element");

  srmelemt.forEach((el) => {
    el.classList.remove("show");
    el.addEventListener("transitionend", ()=>{
      el.remove();
    })
  });

  elements.forEach((el, i) => {
    el.classList.add("hide");
    el.addEventListener("transitionend", ()=>{
      el.remove();
    })
  });
  let sh3 = document.querySelector(".srth3");
  sh3.classList.remove("srth3v")
  numbers = [];
});


const addBtn   = document.getElementById("add");
const sortBtn  = document.getElementById("Sort");
const clearBtn = document.getElementById("clear");

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function nextFrame(){ return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }
function setUI(disabled){
  addBtn.disabled = disabled;
  sortBtn.disabled = disabled;
  clearBtn.disabled = disabled;
}

// create a floating clone positioned over an element (for animation)
function makeFlyClone(fromEl){
  const rect = fromEl.getBoundingClientRect();
  const clone = fromEl.cloneNode(true);
  clone.classList.add("flying");
  clone.style.left = rect.left + "px";
  clone.style.top  = rect.top  + "px";
  clone.style.width  = rect.width  + "px";
  clone.style.height = rect.height + "px";
  document.body.appendChild(clone);
  return { clone, rect };
}

// drop two items a bit to “compare”, then remove clones
async function animateComparePair(idxA, idxB){
  const box = document.getElementById("arrayBox");
  const elA = box.children[idxA];
  const elB = box.children[idxB];
  if (!elA || !elB) return;

  const { clone: flyA, rect: rA } = makeFlyClone(elA);
  const { clone: flyB, rect: rB } = makeFlyClone(elB);

  // color hint: red = might move, green = smaller (no swap) – purely visual
  const aVal = Number(elA.querySelector(".value").textContent);
  const bVal = Number(elB.querySelector(".value").textContent);
  const aBox = flyA.querySelector(".value");
  const bBox = flyB.querySelector(".value");
  if (aVal > bVal) { aBox.style.background = "#ff6b6b"; bBox.style.background = "#6bffa1"; }
  else             { aBox.style.background = "#6bffa1"; bBox.style.background = "#ff6b6b"; }

  await nextFrame();
  // drop both down the same distance
  flyA.style.transform = `translate(0, 100px)`;
  flyB.style.transform = `translate(0, 100px)`;
  await sleep(600);

  // clean up
  flyA.remove();
  flyB.remove();
}

// move the confirmed max (rightmost in the current pass) from top row to Sorted Array
async function moveMaxToSorted(idx){
  const arrayBox  = document.getElementById("arrayBox");
  const sortedBox = document.getElementById("sortedBox");
  const srcEl = arrayBox.children[idx];
  if (!srcEl) return;

  // make a flying clone from the current element
  const { clone: fly, rect: srcRect } = makeFlyClone(srcEl);

  // create a hidden ghost in the sorted row to measure destination
  const ghost = document.createElement("div");
  ghost.className = "element";
  ghost.style.visibility = "hidden";
  const v = document.createElement("div");
  v.className = "value sortedVal";
  v.textContent = numbers[idx];
  ghost.appendChild(v);
  sortedBox.appendChild(ghost);

  const destRect = ghost.getBoundingClientRect();

  await nextFrame();
  fly.style.transform = `translate(${destRect.left - srcRect.left}px, ${destRect.top - srcRect.top}px)`;
  await sleep(650);

  // finalize in sorted row
  ghost.remove();
  const finalEl = document.createElement("div");
  finalEl.className = "element show";
  const finalVal = document.createElement("div");
  finalVal.className = "value sortedVal";
  finalVal.textContent = numbers[idx];
  finalEl.appendChild(finalVal);
  sortedBox.appendChild(finalEl);

  fly.remove();

  // remove it from unsorted numbers and re-render the top row smaller
  numbers.splice(idx, 1);
  renderArray();
}

// ---- NEW Sort flow (pure bubble sort visualization) ----
document.getElementById("Sort").addEventListener("click", async () => {
  if (numbers.length < 2) return;

  document.querySelector(".srth3").classList.add("srth3v");
  document.getElementById("sortedBox").innerHTML = "";
  setUI(true);

  // Bubble sort with visual:
  // shrink the working range (end) each pass; after each pass, send the max to #sortedBox
  let end = numbers.length;
  while (end > 1) {
    for (let j = 0; j < end - 1; j++) {
      // show current pair dropping down (comparison)
      await animateComparePair(j, j + 1);

      // swap in the top row if needed
      if (numbers[j] > numbers[j + 1]) {
        const tmp = numbers[j];
        numbers[j] = numbers[j + 1];
        numbers[j + 1] = tmp;
        renderArray(); // reflect swap in unsorted row
        await sleep(200);
      }
    }

    // move the bubbled max (at index end-1) to the sorted row (ONLY time we add below)
    await moveMaxToSorted(end - 1);
    end--;
  }

  // move the last remaining item
  if (numbers.length === 1) {
    await moveMaxToSorted(0);
  }

  setUI(false);
});


