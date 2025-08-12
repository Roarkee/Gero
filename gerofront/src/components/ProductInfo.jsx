import { useState } from 'react';

const ProductInfo = () => {
  const [items, setItems] = useState([{name: 'G 63', quantity: 2}, {name: 'Bentley Bentayga', quantity: 1}]);
  const [inputValue, setInputValue] = useState('');
  const [inputValue1, setinputValue1] = useState('');

  const handleChange = (e) => {
   const {type, value} = e.target;
   if (type === 'text') {
    setInputValue(value);
   }else{
    setinputValue1(value)
   }
  }
  const handleSubmit =(e) => {
    e.preventDefault();
    setItems([...items, {name: inputValue, quantity: inputValue1}]);
    setInputValue('');
    setinputValue1('');
  }

  return (
    <div>
              <h2>Shopping List</h2>
      <form onSubmit={handleSubmit} >

        <label>name: </label>
        <input type="text" onChange={handleChange} value={inputValue} required/><br />
        <label >quantity</label>
        <input type="number" value={inputValue1} onChange={handleChange} required/><br />
        <button type='submit'>Add Item</button>
        
      </form>

      <ul>
        {items.map((item,index)=>{
          return(
            <li key={index}>God please give me {item.quantity} of {item.name} </li>
          )
        })}
      </ul>
    </div>
  )
}

export default ProductInfo;