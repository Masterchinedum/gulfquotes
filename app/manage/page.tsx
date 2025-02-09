import Link from 'next/link'

const page = () => {
  return (
    <div>
      <div>
      This is the Management page
      </div>
      <Link href="/manage/author-profiles">
        <button>View Author Profile</button>
      </Link>
      <Link href="/manage/quotes">
        <button>View Quotes</button>
      </Link>
    </div>
  )
}

export default page
