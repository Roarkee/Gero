
const date= new Date()

const Header = () => {
  return <div>
    <h1>Greetings puny humans, your salvaiton is here!</h1>
    <p> {date.getDate()}</p>
  </div>
}

export default Header;

