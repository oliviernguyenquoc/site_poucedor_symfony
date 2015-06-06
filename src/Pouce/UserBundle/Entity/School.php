<?php

namespace Pouce\UserBundle\Entity;

use Gedmo\Mapping\Annotation as Gedmo;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * School
 * 
 * @ORM\Table(name="school")
 * @ORM\Entity
 * @ORM\Entity(repositoryClass="Pouce\UserBundle\Entity\SchoolRepository")
 */
class School
{
    /**
     * @var integer
     *
     * @ORM\Column(name="id", type="integer")
     * @ORM\Id
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @var string
     * @Assert\NotBlank()
     * @Assert\NotNull()
     *
     * @ORM\Column(name="name", type="string", length=255)
     */
    private $name;

    /**
     * @var string
     * @Assert\NotBlank()
     *
     * @ORM\Column(name="sigle", type="string", length=10)
     */
    private $sigle;

    /**
     * @ORM\ManyToMany(targetEntity="Pouce\SiteBundle\Entity\Edition", inversedBy="editions")
     */
    private $editions;

    /**
     * @var \DateTime $updated
     *
     * @Gedmo\Timestampable(on="update")
     * @ORM\Column(type="datetime")
     */
    private $updated;


    /**
     * Get id
     *
     * @return integer 
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set name
     *
     * @param string $name
     * @return School
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @return string 
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set sigle
     *
     * @param string $sigle
     * @return School
     */
    public function setSigle($sigle)
    {
        $this->sigle = $sigle;

        return $this;
    }

    /**
     * Get sigle
     *
     * @return string 
     */
    public function getSigle()
    {
        return $this->sigle;
    }

    /**
     * Set autoriseInscription
     *
     * @param boolean $autoriseInscription
     * @return School
     */
    public function setAutoriseInscription($autoriseInscription)
    {
        $this->autoriseInscription = $autoriseInscription;

        return $this;
    }

    /**
     * Get autoriseInscription
     *
     * @return boolean 
     */
    public function getAutoriseInscription()
    {
        return $this->autoriseInscription;
    }
    /**
     * Constructor
     */
    public function __construct()
    {
        $this->editions = new \Doctrine\Common\Collections\ArrayCollection();
    }

    /**
     * Set updated
     *
     * @param \DateTime $updated
     * @return School
     */
    public function setUpdated($updated)
    {
        $this->updated = $updated;

        return $this;
    }

    /**
     * Get updated
     *
     * @return \DateTime 
     */
    public function getUpdated()
    {
        return $this->updated;
    }

    /**
     * Add editions
     *
     * @param \Pouce\SiteBundle\Entity\Edition $editions
     * @return School
     */
    public function addEdition(\Pouce\SiteBundle\Entity\Edition $editions)
    {
        $this->editions[] = $editions;

        return $this;
    }

    /**
     * Remove editions
     *
     * @param \Pouce\SiteBundle\Entity\Edition $editions
     */
    public function removeEdition(\Pouce\SiteBundle\Entity\Edition $editions)
    {
        $this->editions->removeElement($editions);
    }

    /**
     * Get editions
     *
     * @return \Doctrine\Common\Collections\Collection 
     */
    public function getEditions()
    {
        return $this->editions;
    }
}
