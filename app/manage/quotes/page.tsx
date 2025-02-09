import Link from "next/link"

const QuotesList = () => {
  return (
    <div>
      <div>
      This is the Quote listing page
      </div>
      <Link href="/manage/quotes">
        <button>Create Author Profile</button>
      </Link>
      
    </div>
  )
}

export default QuotesList