import Link from 'next/link'

const page = () => {
  return (
    <div>
      <Link href="/manage/author-profiles/create">
        <button>Create Author Profile</button>
      </Link>
    </div>
  )
}

export default page
