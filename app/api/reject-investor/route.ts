export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { address } = body

    // TODO: Implement investor rejection logic
    console.log("Rejecting investor:", { address })

    return Response.json({ success: true, message: "Investor rejected" })
  } catch (error) {
    console.error("Error rejecting investor:", error)
    return Response.json({ error: "Failed to reject investor" }, { status: 500 })
  }
}
