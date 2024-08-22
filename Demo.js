document.addEventListener("DOMContentLoaded", () => {
  let formData = {}; // object for row information
  let dataBase = []; //array for storing the table data
  const tBody = document.querySelector("tbody");
  const addAmountBtn = document.querySelector("#addAmount");
  const addAmountForm = document.querySelector(".amountForm");
  const amountField = document.querySelector("#amount");
  const quantityField = document.querySelector("#quantity");
  const calculationForm = document.querySelector(".calc");
  const given_am = document.querySelector("#given_amount");
  const bill_am = document.querySelector("#bill_amount");

  // event listner for add amount form
  if (addAmountBtn) {
    addAmountBtn.addEventListener("click", () => {
      if (
        addAmountForm.style.display === "none" ||
        addAmountForm.style.display === ""
      ) {
        addAmountForm.style.display = "flex";
      } else {
        addAmountForm.style.display = "none";
      }
    });
  }

  let id = 1; // defined id for rows

  //event listner for form[add amount] submission
  addAmountForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const fd = new FormData(addAmountForm);
    formData["id"] = "row" + id;
    for (const [key, value] of fd) {
      formData[key] = parseInt(value);
    }
    id++;
    const { amount, quantity } = formData;
    if (!isNaN(amount) && !isNaN(quantity)) {
      if (dataBase.length === 0) {
        dataBase.push(formData);
        createRow(formData);
      } else {
        const am = dataBase.find((dataBase) => dataBase.amount === amount);
        if (am) {
          am.quantity = am.quantity + quantity;
          tBody.innerHTML = "";
          dataBase.forEach((elem) => createRow(elem));
        } else {
          dataBase.push(formData);
          createRow(formData);
        }
      }
    }
    formData = {};
    amountField.value = "";
    quantityField.value = "";
  });

  //function to create row
  const createRow = (formData) => {
    const { id, amount, quantity } = formData;
    const row = document.createElement("tr");
    const amountCell = document.createElement("td");
    const quantityCell = document.createElement("td");
    const editBtn = document.createElement("button");

    row.setAttribute("id", id);
    editBtn.setAttribute("data-btn-id", id);
    quantityCell.setAttribute("contenteditable", false);

    amountCell.textContent = amount;
    quantityCell.textContent = quantity;
    editBtn.textContent = "Edit";

    row.appendChild(amountCell);
    row.appendChild(quantityCell);
    row.appendChild(editBtn);
    loadRow(row);
  };

  //function to load the row in the table
  const loadRow = (row) => {
    if (tBody) {
      tBody.appendChild(row);
    }
    row.querySelector("button").addEventListener("click", () => {
      const amountCell = row.firstChild;
      const quantityCell = amountCell.nextSibling;
      const editBtn = row.lastChild;
      editBtn.textContent = "Apply";
      quantityCell.setAttribute("contenteditable", true);
      quantityCell.style.border = "1px solid black";

      quantityCell.addEventListener("blur", handleInputChange);
      function handleInputChange() {
        const qnt = parseInt(quantityCell.textContent);
        const am = parseInt(amountCell.textContent);
        if (qnt === 0) {
          console.log(parseInt(qnt));
          dataBase = dataBase.filter((elem) => elem.amount !== am);
          tBody.innerHTML = "";
          dataBase.forEach((elem) => createRow(elem));
        }
        dataBase.forEach((elem) => {
          if (elem.amount === parseInt(amountCell.textContent)) {
            elem.quantity = parseInt(quantityCell.textContent);
            tBody.innerHTML = "";
            dataBase.forEach((elem) => createRow(elem));
          }
        });

        editBtn.textContent = "Edit";
      }

      return;
    });
  };

  //event listner for calculation form
  calculationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const notes = []; //to store the currency notes
    const calcData = []; // to store the form data

    let i = 0;

    dataBase.forEach((element) => {
      notes[i] = element.amount;
      i++;
    });
    notes.sort((a, b) => b - a); //sorted from higher to lower

    const fd = new FormData(calculationForm);
    fd.forEach((value, key) => {
      calcData.push(value);
    });

    given_am.value = ""; //to make input fields empty after submission
    bill_am.value = "";

    // function to check the quantity in dataBase array
    function checkQuantity(note, quantityOfNote) {
      const index = dataBase.findIndex((elem) => note === elem.amount);

      if (index !== -1) {
        const elem = dataBase[index];
        const availableQuantity =
          quantityOfNote > elem.quantity ? elem.quantity : quantityOfNote;

        //updated the quantity
        dataBase.forEach((element) => {
          if (elem === element) {
            element.quantity = element.quantity - availableQuantity;
          }
        });

        //removed the item
        if (elem.quantity === 0) {
          dataBase.splice(index, 1);
        }
        return availableQuantity;
      }

      return 0;
    }

    const change = calcData[0] - calcData[1]; // change

    let remainingChange = undefined; //to store remaining change after each iteration

    const requiredNotes = {}; // to store the required note for paying change to customer

    function findOptimalNotes(change, notes) {
      for (const elem of notes) {
        const remainder = change % elem;
        const quantityNeeded = Math.floor(change / elem);
        if (remainder === 0) {
          const currency = dataBase.find((el) => el.amount === elem);
          if (quantityNeeded <= currency.quantity) {
            requiredNotes[currency.amount] = parseInt(quantityNeeded);
            const index = dataBase.findIndex((elem) => elem === currency);

            if (currency.quantity > quantityNeeded) {
              const updatedQuantity = currency.quantity - quantityNeeded;
              dataBase.forEach((element) => {
                if (currency === element) {
                  element.quantity = updatedQuantity;
                }
              });
            } else {
              dataBase.splice(index, 1);
            }
            return true;
          }
          return false;
        }
      }
    }

    let remainingBill = change;
    remainingChange = change % 10; // the coins

    if (remainingChange !== 0) {
      remainingBill -= remainingChange; // deduct coins from total change
    }

    const result = findOptimalNotes(remainingBill, notes);

    if (!result) {
      for (let i = 0; i < notes.length; i++) {
        const nextNote = notes[i + 1] || 0; // next currency note

        if (remainingBill >= notes[i]) {
          if (remainingBill === notes[i]) {
            requiredNotes[notes[i]] = 1;
            const availableNotes = checkQuantity(
              notes[i],
              requiredNotes[notes[i]]
            );
            if (availableNotes !== 0) {
              requiredNotes[notes[i]] = availableNotes;
            } else {
              continue;
            }
            remainingBill = 0;
            break;
          } else if (remainingBill > notes[i]) {
            requiredNotes[notes[i]] = Math.floor(remainingBill / notes[i]);
            const availableNotes = checkQuantity(
              notes[i],
              requiredNotes[notes[i]]
            );

            if (availableNotes !== 0) {
              requiredNotes[notes[i]] = availableNotes;
            } else {
              continue;
            }

            remainingBill -= notes[i] * availableNotes;
          } else if (remainingBill >= nextNote * 2) {
            requiredNotes[nextNote] = Math.floor(remainingBill / nextNote);
            const availableNotes = checkQuantity(
              nextNote,
              requiredNotes[nextNote]
            );

            if (availableNotes !== 0) {
              requiredNotes[nextNote] = availableNotes;
            } else {
              continue;
            }

            remainingBill -= nextNote * availableNotes;
          } else {
            requiredNotes[nextNote] = Math.floor(remainingBill / nextNote);
            const availableNotes = checkQuantity(
              nextNote,
              requiredNotes[nextNote]
            );

            if (availableNotes !== 0) {
              requiredNotes[nextNote] = availableNotes;
            } else {
              continue;
            }

            remainingBill -= nextNote * availableNotes;
          }
        }
      }
    }

    const calcParent = document.querySelector(".calculations");

    const requiredNotesArr = Object.entries(requiredNotes).reverse();

    //updating the table after each payment
    tBody.innerHTML = "";
    dataBase.forEach((el) => {
      createRow(el);
    });

    const existingSpans = calcParent.querySelectorAll("span");
    existingSpans.forEach((span) => {
      calcParent.removeChild(span);
    });

    let availableAmount = 0; // to display the available amount
    let remainingAmount = 0; // to display the unavailable amount

    fd.forEach((value, key) => {
      const span = document.createElement("span");
      span.textContent = `${key} : ${value}`;
      calcParent.insertAdjacentElement("beforeend", span);
    });

    if (requiredNotesArr.length > 0) {
      requiredNotesArr.forEach((elem) => {
        if (elem[1] > 0) {
          const span = document.createElement("span");
          span.textContent = `${elem[0]} x ${elem[1]} note`;
          calcParent.insertAdjacentElement("beforeend", span);
          availableAmount += parseInt(elem[0]) * parseInt(elem[1]);
          remainingAmount = change - availableAmount;
        }
      });
    } else {
      remainingAmount = change;
    }

    if (availableAmount !== undefined) {
      const span = document.createElement("span");
      span.textContent = `Available amount : ${availableAmount}`;
      calcParent.insertAdjacentElement("beforeend", span);
      if (remainingAmount > 0) {
        alert(`Shopkeeper doesn't have change of ${remainingAmount}`);
      }
    } else {
      // If no required notes are available
      if (remainingChange !== 0) {
        alert(`${remainingChange} rupee change unavailable...`);
      } else {
        alert("Shopkeeper cannot provide the required change.");
      }
    }

    if (change < 0) {
      alert("Given Amount is insufficient ....");
    }
  });

  function isNote(note) {
    return dataBase.some((elem) => elem.amount === note && elem.quantity > 0);
  }
});
